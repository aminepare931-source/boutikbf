import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  created_at?: string;
};

const KEY = "boutikbf-current-shop";
const SHOPS_CACHE_KEY = "boutikbf-shops-cache";

function loadCachedShops(): Shop[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHOPS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Shop[]) : [];
  } catch {
    return [];
  }
}

export function useShops() {
  const [shops, setShops] = useState<Shop[]>(() => loadCachedShops());
  const [currentId, setCurrentId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY);
  });
  const [loading, setLoading] = useState(() => shops.length === 0);

  const load = async () => {
    if (typeof window === "undefined") return;
    if (loading) setLoading(true);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setLoading(false);
      return;
    }

    // 1. Fetch shops owned by the current user
    const { data: ownedShops } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", user.user.id);

    // 2. Fetch shops where the user is a member (e.g. employee)
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

    // Sort by created_at ascending
    joinedShops.sort((a, b) => {
      const dateA = a.id ? (a as any).created_at : "";
      const dateB = b.id ? (b as any).created_at : "";
      return new Date(dateA || 0).getTime() - new Date(dateB || 0).getTime();
    });

    const list = joinedShops;
    setShops(list);
    localStorage.setItem(SHOPS_CACHE_KEY, JSON.stringify(list));

    const stored = localStorage.getItem(KEY);
    const valid = stored && list.some((s) => s.id === stored) ? stored : (list[0]?.id ?? null);
    setCurrentId(valid);
    if (valid) localStorage.setItem(KEY, valid);
    setLoading(false);
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
