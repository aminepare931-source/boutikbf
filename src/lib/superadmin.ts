import { supabase } from "@/integrations/supabase/client";

/** Appelle une fonction SQL `admin_*` (réservée aux super admins côté base). */
export async function adminRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await (supabase as any).rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const PLAN_LABELS: Record<string, string> = {
  essentiel: "Essai gratuit",
  essentiel_paid: "Essentiel (payé)",
  pro: "Pro",
  "sur-mesure": "Sur mesure",
};

export type AdminShop = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  owner_email: string | null;
  owner_name: string | null;
  phone: string | null;
  created_at: string;
  trial_ends_at: string | null;
  is_suspended: boolean;
  admin_notes: string | null;
  members_count: number;
  products_count: number;
  sales_count: number;
  sales_total: number;
  last_sale_at: string | null;
  last_sign_in_at: string | null;
};

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  shops_count: number;
  is_super_admin: boolean;
};

/** Date de fin d'essai effective (trial_ends_at, sinon création + 15 jours). */
export function trialEnd(shop: Pick<AdminShop, "trial_ends_at" | "created_at">): Date {
  if (shop.trial_ends_at) return new Date(shop.trial_ends_at);
  return new Date(new Date(shop.created_at).getTime() + 15 * 86400000);
}

export function trialDaysLeft(shop: Pick<AdminShop, "trial_ends_at" | "created_at">): number {
  return Math.ceil((trialEnd(shop).getTime() - Date.now()) / 86400000);
}

/* ---------- Tableau de bord : performance du SaaS ---------- */

/** Tarifs mensuels (F CFA) servant à estimer le revenu. « Sur mesure » est sur devis : non compté. */
export const PLAN_PRICES: Record<string, number> = {
  essentiel_paid: 5000,
  pro: 10000,
};

export type DashboardDay = {
  day: string;
  users: number;
  shops: number;
  sales: number;
  volume: number;
};

export type DashboardShopRow = {
  id: string;
  name: string;
  plan?: string;
  phone?: string | null;
  owner_email?: string | null;
  trial_end?: string;
  sales_all: number;
  sales_p?: number;
  volume_p?: number;
  last_sale: string | null;
};

export type AdminDashboard = {
  days: number;
  series: DashboardDay[];
  totals: {
    shops: number;
    users: number;
    products: number;
    sales_all: number;
    volume_all: number;
    shops_p: number;
    shops_prev: number;
    users_p: number;
    users_prev: number;
    sales_p: number;
    sales_prev: number;
    volume_p: number;
    volume_prev: number;
    shops_before: number;
    users_before: number;
  };
  plans: {
    essentiel: number;
    essentiel_paid: number;
    pro: number;
    sur_mesure: number;
    trials_active: number;
    trials_ending_7d: number;
    trials_expired: number;
    suspended: number;
  };
  activity: { active_7d: number; active_30d: number; dormant: number; never_sold: number };
  conversions: { now: number; prev: number };
  top_shops: DashboardShopRow[];
  at_risk: DashboardShopRow[];
  hot_trials: DashboardShopRow[];
};

/* ---------- Fiche boutique : infos complètes + performance ---------- */

export type ShopDetails = {
  days: number;
  shop: AdminShop & {
    slug: string;
    logo_url: string | null;
    currency: string;
    country: string | null;
    address: string | null;
    email: string | null;
    trial_end: string;
  };
  owner: {
    email: string | null;
    full_name: string | null;
    phone: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
    banned_until: string | null;
  };
  sales: {
    n_all: number;
    v_all: number;
    n_cancelled: number;
    last_sale: string | null;
    n_p: number;
    v_p: number;
    n_prev: number;
    v_prev: number;
    avg_basket_p: number | null;
    avg_basket_all: number | null;
  };
  series: { day: string; sales: number; volume: number }[];
  payments: { method: string; n: number; volume: number }[];
  top_products: { name: string; qty: number; revenue: number }[];
  top_customers: { name: string; n: number; volume: number }[];
  catalog: {
    categories: number;
    products: number;
    active: number;
    inactive: number;
    with_barcode: number;
    stock_units: number;
    stock_value: number;
    out_of_stock: number;
    low_stock: number;
  };
  stock_alerts: {
    name: string;
    stock: number;
    unit: string | null;
    stock_min: number;
    state: string;
  }[];
  customers: { count: number; with_credit: number; credit_total: number };
  members: { name: string | null; role: string; created_at: string }[];
  employees: { name: string; role: string; is_active: boolean; created_at: string }[];
  recent_sales: {
    id: string;
    created_at: string;
    total: number;
    payment_method: string;
    status: string;
    customer: string | null;
  }[];
  audit: { action: string; created_at: string; details: unknown; admin: string | null }[];
};

/** Lien WhatsApp (numéros burkinabè à 8 chiffres : indicatif 226 ajouté). */
export function whatsappLink(phone: string | null | undefined, message: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const full = digits.length === 8 ? `226${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}
