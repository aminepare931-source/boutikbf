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
