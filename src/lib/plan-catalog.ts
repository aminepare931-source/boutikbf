/**
 * Catalogue des formules BoutikBF : prix et limites, sans dépendance à l'application
 * (utilisé aussi par la page d'accueil publique).
 * Les limites d'articles, d'employés et de boutiques sont AUSSI appliquées côté base de
 * données (migration 20261112000000_plan_limits.sql) : si tu modifies une valeur ici,
 * modifie-la aussi dans cette migration.
 */

export type Tier = "essentiel" | "pro" | "sur-mesure";

export const TRIAL_DAYS = 15;

/** Prix en F CFA. L'annuel = 10 mois payés sur 12 (2 mois offerts). */
export const PRICES = {
  essentiel: { month: 5000, year: 50000 },
  pro: { month: 10000, year: 100000 },
  extraShop: 5000,
} as const;

/** null = illimité */
export const LIMITS: Record<
  Tier,
  {
    products: number | null;
    employees: number | null;
    shops: number | null;
    historyDays: number | null;
  }
> = {
  essentiel: { products: 500, employees: 2, shops: 1, historyDays: 90 },
  pro: { products: null, employees: 10, shops: 3, historyDays: null },
  "sur-mesure": { products: null, employees: null, shops: null, historyDays: null },
};

export const TIER_LABEL: Record<Tier, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  "sur-mesure": "Sur mesure",
};

export const fmtPrice = (n: number) =>
  `${n.toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0")} F`;
