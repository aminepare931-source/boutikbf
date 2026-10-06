import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEmployeeSession } from "@/lib/employee-session";

export type Shop = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  logo_url: string | null;
  owner_id: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  shop_type?: string | null;
  shop_keywords?: string[] | null;
  plan?: string;
  trial_ends_at?: string | null;
  is_suspended?: boolean;
  created_at?: string;
};

const KEY = "boutikbf-current-shop";
const SHOPS_CACHE_KEY = "boutikbf-shops-cache";

type ShopsCache = { owner: string; shops: Shop[] };

/** Efface tout ce qui est mis en cache sur l'appareil (à appeler à la déconnexion). */
export function clearShopCaches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SHOPS_CACHE_KEY);
  } catch {
    // stockage indisponible
  }
}

/** Identifiant de la personne connectée, lu sans appel réseau (compte Supabase ou employé). */
function peekOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
        const id = JSON.parse(localStorage.getItem(k) ?? "null")?.user?.id;
        if (id) return `user:${id}`;
      }
    }
  } catch {
    // ignoré
  }
  const emp = getEmployeeSession();
  return emp ? `emp:${emp.employeeId}` : null;
}

/** Boutiques en cache — uniquement si elles appartiennent à la personne connectée. */
function loadCachedShops(): Shop[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHOPS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShopsCache | Shop[];
    if (Array.isArray(parsed)) {
      // ancien format (sans propriétaire) : on le jette pour éviter toute fuite entre comptes
      localStorage.removeItem(SHOPS_CACHE_KEY);
      return [];
    }
    return parsed.owner && parsed.owner === peekOwner() ? parsed.shops : [];
  } catch {
    return [];
  }
}

export function useShops() {
  const [shops, setShops] = useState<Shop[]>(() => loadCachedShops());
  const [currentId, setCurrentId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(KEY);
    return stored && loadCachedShops().some((s) => s.id === stored) ? stored : null;
  });
  const [loading, setLoading] = useState(() => shops.length === 0);

  const finish = (list: Shop[], owner: string) => {
    setShops(list);
    localStorage.setItem(
      SHOPS_CACHE_KEY,
      JSON.stringify({ owner, shops: list } satisfies ShopsCache),
    );
    const stored = localStorage.getItem(KEY);
    const valid = stored && list.some((s) => s.id === stored) ? stored : (list[0]?.id ?? null);
    setCurrentId(valid);
    if (valid) localStorage.setItem(KEY, valid);
    else localStorage.removeItem(KEY);
    setLoading(false);
  };

  const load = async () => {
    if (typeof window === "undefined") return;
    if (loading) setLoading(true);

    const { data: user } = await supabase.auth.getUser();

    // Employé connecté par PIN (pas de compte Supabase) : une seule boutique, la sienne
    if (!user.user) {
      const emp = getEmployeeSession();
      if (!emp) {
        clearShopCaches();
        setShops([]);
        setCurrentId(null);
        setLoading(false);
        return;
      }
      const { data: shop } = await supabase
        .from("shops")
        .select("*")
        .eq("id", emp.shopId)
        .maybeSingle();
      finish(shop ? [shop as Shop] : [], `emp:${emp.employeeId}`);
      return;
    }

    // 1. Boutiques dont l'utilisateur est propriétaire
    const { data: ownedShops } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", user.user.id);

    // 2. Boutiques où l'utilisateur est membre
    const { data: memberships } = await supabase
      .from("shop_members")
      .select("shop_id")
      .eq("user_id", user.user.id);

    const memberShopIds = memberships?.map((m) => m.shop_id) ?? [];
    const joinedShops = (ownedShops ?? []) as Shop[];

    if (memberShopIds.length > 0) {
      const { data: memberShops } = await supabase
        .from("shops")
        .select("*")
        .in("id", memberShopIds);

      if (memberShops) {
        const existingIds = new Set(joinedShops.map((s) => s.id));
        for (const shop of memberShops as Shop[]) {
          if (!existingIds.has(shop.id)) {
            joinedShops.push(shop);
          }
        }
      }
    }

    joinedShops.sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
    );

    finish(joinedShops, `user:${user.user.id}`);
  };

  useEffect(() => {
    load();
  }, []);

  const setCurrent = (id: string) => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, id);
    setCurrentId(id);
  };

  return {
    shops,
    currentId,
    current: shops.find((s) => s.id === currentId) ?? null,
    setCurrent,
    loading,
    reload: load,
  };
}

/** Resolve a storage path or public URL into a signed/usable URL. */
export async function resolveLogoUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  const { data } = await supabase.storage
    .from("shop-logos")
    .createSignedUrl(pathOrUrl, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}
