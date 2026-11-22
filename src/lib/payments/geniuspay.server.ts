import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Agrégateur de paiement GeniusPay : https://pay.genius.ci/doc
 * Ce module ne contient QUE de la logique pure (pas de base de données, pas de réseau),
 * pour être testé à fond. Il ne doit jamais être importé côté navigateur (clés secrètes).
 */

export const GENIUSPAY_API_BASE = "https://pay.genius.ci/api/v1/merchant";

/** Statuts internes (ceux de la table payment_intents). */
export type PaymentStatus =
  "pending" | "processing" | "paid" | "failed" | "cancelled" | "expired" | "refunded";

export type Environment = "live" | "sandbox";

/** completed (GeniusPay) = paid (chez nous). Tout statut inconnu est ignoré, jamais deviné. */
export function mapProviderStatus(status: unknown): PaymentStatus | null {
  switch (String(status ?? "").toLowerCase()) {
    case "pending":
      return "pending";
    case "processing":
      return "processing";
    case "completed":
      return "paid";
    case "failed":
      return "failed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "expired":
      return "expired";
    case "refunded":
      return "refunded";
    default:
      return null;
  }
}

/** Seuls des liens de paiement hébergés par GeniusPay sont acceptés (jamais de redirection libre). */
const ALLOWED_CHECKOUT_HOSTS = ["genius.ci", "geniuspay.ci", "geniuspay.io"];

export function isTrustedCheckoutUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_CHECKOUT_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export interface InitiateInput {
  amount: number;
  description: string;
  customer: { name?: string; email?: string; phone?: string; country?: string };
  successUrl: string;
  errorUrl: string;
  metadata: Record<string, string>;
}

/**
 * Corps de la demande de paiement. On n'envoie pas « payment_method » : le client choisit
 * lui-même Orange Money, Moov Money ou MTN sur la page de paiement GeniusPay.
 */
export function buildInitiateBody(i: InitiateInput): Record<string, unknown> {
  const customer = Object.fromEntries(
    Object.entries(i.customer).filter(([, v]) => typeof v === "string" && v.length > 0),
  );
  return {
    amount: i.amount,
    currency: "XOF",
    description: i.description.slice(0, 500),
    ...(Object.keys(customer).length ? { customer } : {}),
    success_url: i.successUrl,
    error_url: i.errorUrl,
    metadata: i.metadata,
  };
}

type Json = Record<string, any>;

/** « live » seulement si GeniusPay (ou la clé utilisée) le dit explicitement. */
export function environmentOf(json: Json, apiKey: string): Environment {
  const e = String(json?.data?.environment ?? json?.environment ?? "").toLowerCase();
  if (e === "live" || e === "production") return "live";
  if (e === "sandbox" || e === "test") return "sandbox";
  return apiKey.startsWith("pk_live_") ? "live" : "sandbox";
}

export interface InitiateResult {
  providerRef: string;
  checkoutUrl: string;
  expiresAt: string | null;
  fees: number | null;
  environment: Environment;
}

export function parseInitiateResponse(json: Json, apiKey: string): InitiateResult {
  const d = json?.data;
  if (!json?.success || !d || typeof d.reference !== "string" || !d.reference) {
    throw new Error("Réponse GeniusPay invalide (référence absente)");
  }
  const checkoutUrl = String(d.checkout_url ?? d.payment_url ?? "");
  if (!isTrustedCheckoutUrl(checkoutUrl)) {
    throw new Error("Lien de paiement refusé (hôte inattendu)");
  }
  const expires = typeof d.expires_at === "string" ? new Date(d.expires_at) : null;
  const fees = Number(d.fees);
  return {
    providerRef: d.reference,
    checkoutUrl,
    expiresAt: expires && !Number.isNaN(expires.getTime()) ? expires.toISOString() : null,
    fees: Number.isFinite(fees) ? fees : null,
    environment: environmentOf(json, apiKey),
  };
}

export interface PaymentDetails {
  providerRef: string;
  status: PaymentStatus | null;
  amount: number;
  fees: number | null;
  net: number | null;
  method: string | null;
  environment: Environment;
  metadata: Record<string, unknown>;
}

/** Lecture de GET /payments/{reference} : la SEULE source de vérité pour activer une formule. */
export function parsePaymentDetails(json: Json, apiKey: string): PaymentDetails {
  const d = json?.data;
  if (!json?.success || !d || typeof d.reference !== "string") {
    throw new Error("Réponse GeniusPay invalide (paiement introuvable)");
  }
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const fees = num(d.fees);
  const net = num(d.net_amount);
  return {
    providerRef: d.reference,
    status: mapProviderStatus(d.status),
    amount: Number(d.amount),
    fees: fees !== null && Number.isFinite(fees) ? fees : null,
    net: net !== null && Number.isFinite(net) ? net : null,
    method: (d.payment_provider ?? d.payment_method ?? null) as string | null,
    environment: environmentOf(json, apiKey),
    metadata: d.metadata && typeof d.metadata === "object" ? d.metadata : {},
  };
}

/* ---------- Signature des notifications (webhooks) ---------- */

export interface SignatureCheck {
  ok: boolean;
  reason?: "missing" | "bad_timestamp" | "stale" | "mismatch";
}

/** Écriture JSON de PHP (barres obliques et caractères non-ASCII échappés). */
function phpJsonEncode(compactJson: string): string {
  return compactJson
    .replace(/\//g, "\\/")
    .replace(/[\u0080-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/** `provided` vient de l'extérieur : on vérifie qu'il est bien hexadécimal et de bonne longueur AVANT de comparer. */
function safeEqualHex(expected: string, provided: string): boolean {
  if (!/^[0-9a-f]+$/i.test(provided) || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
}

/**
 * Format documenté : signature = HMAC-SHA256( timestamp + "." + payload_json , secret ).
 * On compare d'abord au corps reçu tel quel ; si GeniusPay signe une réécriture du JSON
 * (comme le fait le code PHP de leur documentation), on essaie aussi les deux
 * réécritures usuelles. Fenêtre de 5 minutes contre le rejeu d'anciennes notifications.
 */
export function verifyWebhookSignature(opts: {
  rawBody: string;
  signature: string | null | undefined;
  timestamp: string | null | undefined;
  secret: string | null | undefined;
  nowMs?: number;
  toleranceSec?: number;
}): SignatureCheck {
  const { rawBody, secret } = opts;
  const signature = (opts.signature ?? "")
    .trim()
    .replace(/^sha256=/i, "")
    .toLowerCase();
  const timestamp = (opts.timestamp ?? "").trim();
  if (!secret || !signature || !timestamp) return { ok: false, reason: "missing" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  const now = (opts.nowMs ?? Date.now()) / 1000;
  if (Math.abs(now - ts) > (opts.toleranceSec ?? 300)) return { ok: false, reason: "stale" };

  const candidates = new Set<string>([rawBody]);
  try {
    const compact = JSON.stringify(JSON.parse(rawBody));
    candidates.add(compact);
    candidates.add(phpJsonEncode(compact));
  } catch {
    /* corps non JSON : seule la comparaison brute est possible */
  }
  for (const body of candidates) {
    if (safeEqualHex(hmacHex(secret, `${timestamp}.${body}`), signature)) return { ok: true };
  }
  return { ok: false, reason: "mismatch" };
}

export interface WebhookPayload {
  deliveryId: string | null;
  event: string;
  environment: string | null;
  reference: string | null;
  intentRef: string | null;
}

export function parseWebhookPayload(rawBody: string): WebhookPayload | null {
  let p: Json;
  try {
    p = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!p || typeof p !== "object" || typeof p.event !== "string") return null;
  const md = p.data?.metadata;
  return {
    deliveryId: typeof p.id === "string" ? p.id : null,
    event: p.event,
    environment: typeof p.environment === "string" ? p.environment : null,
    reference: typeof p.data?.reference === "string" ? p.data.reference : null,
    intentRef: md && typeof md.ref === "string" ? md.ref : null,
  };
}
