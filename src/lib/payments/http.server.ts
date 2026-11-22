import { createClient } from "@supabase/supabase-js";
import {
  confirmByRef,
  createCheckout,
  handleWebhook,
  readPaymentsEnv,
  type Db,
  type Deps,
} from "./service.server";

/**
 * Couche HTTP des paiements : lit les variables d'environnement, vérifie la connexion de
 * l'utilisateur, puis délègue à service.server.ts (la logique, testée séparément).
 * Les routes /api/payments/* et /api/webhooks/geniuspay ne sont que de fines enveloppes.
 */

const HEADERS = { "content-type": "application/json", "cache-control": "no-store" };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

const NOT_ENABLED = "Le paiement en ligne n'est pas encore disponible.";

async function buildDeps(): Promise<Deps | null> {
  const env = readPaymentsEnv();
  if (!env) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    db: supabaseAdmin as unknown as Db,
    fetch,
    env,
    log: (msg, extra) => console.warn("[paiements]", msg, extra ?? ""),
  };
}

/** Utilisateur connecté (jeton Supabase vérifié auprès de Supabase). */
async function authenticate(
  request: Request,
): Promise<{ userId: string; email: string | null } | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (token.split(".").length !== 3) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return { userId: data.user.id, email: data.user.email ?? null };
}

async function readJson(
  request: Request,
  maxBytes: number,
): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function handleConfigRequest() {
  return json(200, { enabled: readPaymentsEnv() !== null });
}

export async function handleCheckoutRequest(request: Request) {
  const deps = await buildDeps();
  if (!deps) return json(503, { message: NOT_ENABLED });
  const user = await authenticate(request);
  if (!user) return json(401, { message: "Connectez-vous pour payer votre abonnement." });
  const body = await readJson(request, 4_000);
  if (!body) return json(400, { message: "Demande invalide." });

  const result = await createCheckout(deps, {
    userId: user.userId,
    email: user.email,
    shopId: body.shopId,
    plan: body.plan,
    period: body.period,
    origin: new URL(request.url).origin,
  });
  return result.ok
    ? json(200, { url: result.url, ref: result.ref })
    : json(result.status, { message: result.message });
}

/** Sans connexion requise : on ne reçoit qu'une référence aléatoire et on relit chez GeniusPay. */
export async function handleConfirmRequest(request: Request) {
  const deps = await buildDeps();
  if (!deps) return json(503, { message: NOT_ENABLED });
  const body = await readJson(request, 1_000);
  const result = await confirmByRef(deps, body?.ref);
  return result.ok
    ? json(200, { status: result.status, activated: result.activated, plan: result.plan ?? null })
    : json(result.status, { message: result.message });
}

export async function handleWebhookRequest(request: Request) {
  const deps = await buildDeps();
  if (!deps) return json(503, { error: "disabled" });
  const rawBody = await request.text();
  if (rawBody.length > 200_000) return json(413, { error: "too_large" });
  const out = await handleWebhook(deps, { rawBody, get: (n) => request.headers.get(n) });
  return json(out.status, out.body);
}
