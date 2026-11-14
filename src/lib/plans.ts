import { useShops } from "@/lib/shop-store";
import { fmtPrice, LIMITS, PRICES, TIER_LABEL, TRIAL_DAYS, type Tier } from "@/lib/plan-catalog";

export { fmtPrice, LIMITS, PRICES, TIER_LABEL, TRIAL_DAYS };
export type { Tier };

type ShopPlanInfo =
  | { plan?: string | null; trial_ends_at?: string | null; created_at?: string | null }
  | null
  | undefined;

/** Plan « essentiel » (ou absent) = essai gratuit ; « essentiel_paid » = Essentiel payé. */
export function isTrialPlan(shop: ShopPlanInfo) {
  return !shop?.plan || shop.plan === "essentiel";
}

export function trialEndsAt(shop: ShopPlanInfo): Date | null {
  if (shop?.trial_ends_at) return new Date(shop.trial_ends_at);
  if (shop?.created_at)
    return new Date(new Date(shop.created_at).getTime() + TRIAL_DAYS * 86_400_000);
  return null;
}

export function isTrialActive(shop: ShopPlanInfo) {
  const end = trialEndsAt(shop);
  return isTrialPlan(shop) && !!end && end.getTime() > Date.now();
}

/**
 * Palier réellement appliqué. Pendant l'essai gratuit, la boutique a les droits du
 * Pro pour pouvoir juger toute la valeur ; ensuite elle retombe sur son vrai palier.
 */
export function tierOf(shop: ShopPlanInfo): Tier {
  if (shop?.plan === "sur-mesure") return "sur-mesure";
  if (shop?.plan === "pro") return "pro";
  if (shop?.plan === "essentiel_paid") return "essentiel";
  return isTrialActive(shop) || !shop ? "pro" : "essentiel";
}

export type Feature = "exports" | "cash_control" | "net_profit" | "forecast" | "long_history";

/** Toutes les fonctions ci-dessous sont réservées au Pro et au Sur mesure. */
export function can(shop: ShopPlanInfo, _feature: Feature) {
  return tierOf(shop) !== "essentiel";
}

/** Hook : palier, limites et droits de la boutique courante. */
export function usePlan() {
  const { current } = useShops();
  const tier = tierOf(current);
  return {
    shop: current,
    tier,
    limits: LIMITS[tier],
    trialActive: isTrialActive(current),
    can: (f: Feature) => can(current, f),
  };
}

/* ---------- Messages d'erreur des limites (déclenchées par la base) ---------- */

const KIND_LABEL: Record<string, (n: number) => string> = {
  products: (n) => `${n} articles`,
  employees: (n) => `${n} employés`,
  shops: (n) => `${n} boutique${n > 1 ? "s" : ""}`,
};

/** Transforme l'erreur « PLAN_LIMIT|… » de la base en phrase claire, sinon renvoie null. */
export function planLimitMessage(err: unknown): string | null {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "";
  const m = raw.match(/PLAN_LIMIT\|(\w+)\|(\d+)\|([\w-]+)/);
  if (!m) return null;
  const [, kind, n, tier] = m;
  const what = (KIND_LABEL[kind] ?? ((x: number) => `${x}`))(Number(n));
  const label = TIER_LABEL[tier as Tier] ?? tier;
  const next =
    tier === "essentiel"
      ? "Passez à la formule Pro dans Paramètres."
      : kind === "shops"
        ? `Pour une boutique de plus (${fmtPrice(PRICES.extraShop)} par mois), contactez BoutikBF.`
        : "Contactez BoutikBF pour une offre adaptée.";
  return `Limite de ${what} atteinte pour la formule ${label}. ${next}`;
}

/** Message affiché quand une fonction réservée au Pro est demandée sur Essentiel. */
export const PRO_ONLY_MESSAGE =
  "Cette fonction est réservée à la formule Pro. Rendez-vous dans Paramètres pour passer à Pro.";
