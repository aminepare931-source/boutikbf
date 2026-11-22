import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Côté navigateur : aucune clé secrète ici, on ne fait qu'appeler nos propres routes /api. */

export type PayPlan = "essentiel_paid" | "pro";
export type PayPeriod = "month" | "year";

let enabledPromise: Promise<boolean> | null = null;

/** Vrai quand le serveur a ses clés GeniusPay (sinon l'application garde le paiement manuel). */
export function fetchPaymentsEnabled(): Promise<boolean> {
  enabledPromise ??= fetch("/api/payments/config", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((j) => j?.enabled === true)
    .catch(() => {
      enabledPromise = null; // hors connexion : on réessaiera plus tard
      return false;
    });
  return enabledPromise;
}

export function usePaymentsEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    void fetchPaymentsEnabled().then((v) => live && setEnabled(v));
    return () => {
      live = false;
    };
  }, []);
  return enabled;
}

export async function startOnlinePayment(input: {
  shopId: string;
  plan: PayPlan;
  period: PayPeriod;
}): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, message: "Connectez-vous pour payer votre abonnement." };
  try {
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || typeof json.url !== "string")
      return { ok: false, message: json.message ?? "Paiement impossible pour le moment." };
    return { ok: true, url: json.url };
  } catch {
    return { ok: false, message: "Pas de connexion. Réessayez quand le réseau est revenu." };
  }
}

export async function confirmPayment(
  ref: string,
): Promise<{ status: string; activated: boolean; plan: string | null } | null> {
  try {
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { status: string; activated: boolean; plan: string | null };
  } catch {
    return null;
  }
}
