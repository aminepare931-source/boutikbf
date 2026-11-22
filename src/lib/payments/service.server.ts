import {
  GENIUSPAY_API_BASE,
  buildInitiateBody,
  parseInitiateResponse,
  parsePaymentDetails,
  parseWebhookPayload,
  verifyWebhookSignature,
  type PaymentDetails,
} from "./geniuspay.server";
import { fmtPrice, TIER_LABEL } from "@/lib/plan-catalog";

/**
 * Encaissement des abonnements par GeniusPay.
 *
 * Règles de sécurité (toutes testées) :
 *  1. Le montant vient de la base de données, jamais du navigateur.
 *  2. Une formule n'est activée qu'après avoir RELU le paiement chez GeniusPay avec nos clés
 *     secrètes. Une notification (webhook) ne sert que de déclencheur : même fausse ou
 *     rejouée, elle ne peut rien activer.
 *  3. Montant et référence doivent correspondre exactement à ceux de notre intention.
 *  4. Un paiement de test (sandbox) n'active jamais une vraie formule.
 *  5. Tout est idempotent : une notification reçue deux fois n'active qu'une fois.
 */

export interface PaymentsEnv {
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  apiBase: string;
  siteUrl: string | null;
  allowSandbox: boolean;
}

/** null = paiements en ligne non configurés (l'application garde alors le paiement manuel). */
export function readPaymentsEnv(
  src: Record<string, string | undefined> = process.env,
): PaymentsEnv | null {
  const { GENIUSPAY_API_KEY: apiKey, GENIUSPAY_API_SECRET: apiSecret } = src;
  const webhookSecret = src.GENIUSPAY_WEBHOOK_SECRET;
  if (!apiKey || !apiSecret || !webhookSecret) return null;
  // Sans clé de service Supabase, on ne démarre pas (le client serveur retomberait sur un faux client)
  if (!src.SUPABASE_URL || !src.SUPABASE_SERVICE_ROLE_KEY) return null;
  return {
    apiKey,
    apiSecret,
    webhookSecret,
    apiBase: (src.GENIUSPAY_API_BASE || GENIUSPAY_API_BASE).replace(/\/$/, ""),
    siteUrl: src.SITE_URL ? src.SITE_URL.replace(/\/$/, "") : null,
    allowSandbox: src.GENIUSPAY_ALLOW_SANDBOX === "1",
  };
}

export interface Db {
  rpc(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ data: any; error: { message: string } | null }>;
}

export interface Deps {
  db: Db;
  fetch: typeof fetch;
  env: PaymentsEnv;
  now?: () => number;
  log?: (msg: string, extra?: unknown) => void;
}

export type Result<T> = ({ ok: true } & T) | { ok: false; status: number; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REF = /^BF-[0-9A-F]{24}$/;
const PLANS = ["essentiel_paid", "pro"] as const;
const PERIODS = ["month", "year"] as const;
type Plan = (typeof PLANS)[number];
type Period = (typeof PERIODS)[number];

const UNAVAILABLE =
  "Le service de paiement est momentanément indisponible. Réessayez dans un instant ou payez par transfert.";

function headers(env: PaymentsEnv) {
  return {
    "X-API-Key": env.apiKey,
    "X-API-Secret": env.apiSecret,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function providerFetch(deps: Deps, url: string, init: RequestInit) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15_000);
  try {
    return await deps.fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Messages lisibles pour les refus renvoyés par la base (texte des exceptions SQL). */
function userMessage(dbMessage: string): { status: number; message: string } {
  if (/Accès refusé/i.test(dbMessage))
    return { status: 403, message: "Seul le propriétaire de la boutique peut payer l'abonnement." };
  if (/Trop de tentatives/i.test(dbMessage)) return { status: 429, message: dbMessage };
  if (/suspendue|sur mesure|déjà la formule Pro|inconnue/i.test(dbMessage))
    return { status: 409, message: dbMessage };
  return { status: 400, message: "Demande de paiement invalide." };
}

/* ------------------------------------------------------------------ */
/* 1. Créer un paiement et renvoyer le lien de la page GeniusPay       */
/* ------------------------------------------------------------------ */

export async function createCheckout(
  deps: Deps,
  input: {
    userId: string;
    email?: string | null;
    shopId: unknown;
    plan: unknown;
    period: unknown;
    origin: string;
  },
): Promise<Result<{ url: string; ref: string; reused: boolean }>> {
  const { shopId, plan, period } = input;
  if (typeof shopId !== "string" || !UUID.test(shopId))
    return { ok: false, status: 400, message: "Boutique invalide." };
  if (!PLANS.includes(plan as Plan) || !PERIODS.includes(period as Period))
    return { ok: false, status: 400, message: "Formule ou période invalide." };

  const { data: intent, error } = await deps.db.rpc("payment_create_intent", {
    p_user: input.userId,
    p_shop: shopId,
    p_plan: plan,
    p_period: period,
  });
  if (error || !intent) {
    const m = userMessage(error?.message ?? "");
    return { ok: false, ...m };
  }
  if (intent.reused && intent.checkout_url) {
    return { ok: true, url: intent.checkout_url, ref: intent.ref, reused: true };
  }

  const site = (deps.env.siteUrl ?? input.origin).replace(/\/$/, "");
  const planLabel = plan === "pro" ? TIER_LABEL.pro : TIER_LABEL.essentiel;
  const body = buildInitiateBody({
    amount: Number(intent.amount),
    description: `BoutikBF ${planLabel} - ${period === "year" ? "1 an" : "1 mois"} (${fmtPrice(Number(intent.amount))})`,
    customer: { email: input.email ?? undefined, country: "BF" },
    successUrl: `${site}/paiement/retour?ref=${intent.ref}`,
    errorUrl: `${site}/paiement/retour?ref=${intent.ref}&status=error`,
    metadata: {
      ref: intent.ref,
      intent_id: intent.id,
      shop_id: shopId,
      plan: String(plan),
      period: String(period),
    },
  });

  try {
    const res = await providerFetch(deps, `${deps.env.apiBase}/payments`, {
      method: "POST",
      headers: headers(deps.env),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      deps.log?.("geniuspay: création refusée", { status: res.status, error: json?.error?.code });
      throw new Error(`HTTP ${res.status} ${json?.error?.code ?? ""}`);
    }
    const parsed = parseInitiateResponse(json, deps.env.apiKey);
    await deps.db.rpc("payment_attach_provider", {
      p_intent: intent.id,
      p_provider_ref: parsed.providerRef,
      p_checkout_url: parsed.checkoutUrl,
      p_expires: parsed.expiresAt,
      p_fees: parsed.fees,
      p_env: parsed.environment,
    });
    return { ok: true, url: parsed.checkoutUrl, ref: intent.ref, reused: false };
  } catch (e) {
    deps.log?.("geniuspay: échec de création", e instanceof Error ? e.message : e);
    await deps.db.rpc("payment_fail_creation", {
      p_intent: intent.id,
      p_reason: e instanceof Error ? e.message : "creation_failed",
    });
    return { ok: false, status: 502, message: UNAVAILABLE };
  }
}

/* ------------------------------------------------------------------ */
/* 2. Relire le paiement chez GeniusPay et appliquer le résultat       */
/* ------------------------------------------------------------------ */

export interface ConfirmOutcome {
  status: string;
  activated: boolean;
  plan?: string;
}

export async function confirmByRef(deps: Deps, ref: unknown): Promise<Result<ConfirmOutcome>> {
  if (typeof ref !== "string" || !REF.test(ref))
    return { ok: false, status: 400, message: "Référence invalide." };

  const { data: intent, error } = await deps.db.rpc("payment_get_by_ref", { p_ref: ref });
  if (error) return { ok: false, status: 503, message: UNAVAILABLE };
  if (!intent) return { ok: false, status: 404, message: "Paiement introuvable." };

  // Déjà traité : rien à relire
  if (intent.status === "paid" || intent.status === "refunded")
    return { ok: true, status: intent.status, activated: intent.status === "paid" };
  if (!intent.provider_ref) return { ok: true, status: intent.status, activated: false };

  let details: PaymentDetails;
  try {
    const res = await providerFetch(
      deps,
      `${deps.env.apiBase}/payments/${encodeURIComponent(intent.provider_ref)}`,
      { method: "GET", headers: headers(deps.env) },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`HTTP ${res.status} ${json?.error?.code ?? ""}`);
    details = parsePaymentDetails(json, deps.env.apiKey);
  } catch (e) {
    deps.log?.("geniuspay: lecture impossible", e instanceof Error ? e.message : e);
    return { ok: false, status: 503, message: UNAVAILABLE };
  }

  // La transaction relue doit bien être la nôtre
  const mdRef = details.metadata?.ref;
  if (
    details.providerRef !== intent.provider_ref ||
    (mdRef !== undefined && mdRef !== intent.ref)
  ) {
    deps.log?.("geniuspay: référence incohérente", { ref, got: details.providerRef });
    return { ok: false, status: 409, message: "Paiement incohérent : contactez BoutikBF." };
  }
  if (!details.status) return { ok: true, status: intent.status, activated: false };

  const { data: applied, error: applyErr } = await deps.db.rpc("payment_apply", {
    p_ref: intent.ref,
    p_status: details.status,
    p_amount: details.amount,
    p_fees: details.fees,
    p_net: details.net,
    p_env: details.environment,
    p_method: details.method,
    p_reason: details.status === "failed" ? "failed" : null,
    p_allow_sandbox: deps.env.allowSandbox,
  });
  if (applyErr || !applied) return { ok: false, status: 503, message: UNAVAILABLE };
  if (applied.ok === false) {
    deps.log?.("geniuspay: paiement non appliqué", applied);
    return { ok: false, status: 409, message: "Paiement incohérent : contactez BoutikBF." };
  }
  return {
    ok: true,
    status: String(applied.status ?? details.status),
    activated: applied.activated === true || applied.already === true,
    plan: applied.plan,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Notifications (webhooks) de GeniusPay                            */
/* ------------------------------------------------------------------ */

export async function handleWebhook(
  deps: Deps,
  req: { rawBody: string; get: (name: string) => string | null },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const check = verifyWebhookSignature({
    rawBody: req.rawBody,
    signature: req.get("x-webhook-signature"),
    timestamp: req.get("x-webhook-timestamp"),
    secret: deps.env.webhookSecret,
    nowMs: deps.now?.(),
  });
  if (!check.ok) {
    deps.log?.("geniuspay: notification refusée", check.reason);
    // Rien n'est enregistré pour une notification non authentifiée
    return { status: check.reason === "stale" ? 400 : 401, body: { error: "invalid_signature" } };
  }

  const payload = parseWebhookPayload(req.rawBody);
  if (!payload) return { status: 400, body: { error: "invalid_payload" } };

  const log = (outcome: string) =>
    deps.db.rpc("payment_log_event", {
      p_provider: "geniuspay",
      p_event_id: payload.deliveryId ?? req.get("x-webhook-delivery"),
      p_event: payload.event,
      p_ref: payload.reference,
      p_env: payload.environment,
      p_outcome: outcome,
      p_payload: safeJson(req.rawBody),
    });

  if (!payload.event.startsWith("payment.")) {
    await log("ignored");
    return { status: 200, body: { ok: true, ignored: true } };
  }

  // La notification ne fait que désigner un paiement : l'état réel est relu chez GeniusPay
  const ref = payload.intentRef ?? (await refFromProviderRef(deps, payload.reference));
  if (!ref) {
    await log("unknown_reference");
    return { status: 200, body: { ok: true, unknown: true } }; // accusé de réception : inutile de réessayer
  }

  const result = await confirmByRef(deps, ref);
  if (!result.ok && result.status === 404) {
    await log("unknown_reference");
    return { status: 200, body: { ok: true, unknown: true } };
  }
  if (!result.ok) {
    await log(`error_${result.status}`);
    // 5xx : GeniusPay réessaiera plus tard ; 4xx : définitif
    return { status: result.status >= 500 ? 503 : 200, body: { ok: false } };
  }
  await log(`status_${result.status}`);
  return { status: 200, body: { ok: true, status: result.status } };
}

async function refFromProviderRef(deps: Deps, providerRef: string | null): Promise<string | null> {
  if (!providerRef) return null;
  const { data } = await deps.db.rpc("payment_get_by_ref", { p_ref: providerRef });
  return data?.ref ?? null;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw: raw.slice(0, 2000) };
  }
}
