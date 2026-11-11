-- ============================================================================
-- Lot de fonctionnalités différenciantes (2026-11-12 b)
--  Carte fidélité QR, shifts de caisse, dépenses, anniversaires, favoris
-- À exécuter UNE FOIS (CLI).
-- ============================================================================

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE public.products  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- 1. Dépenses réelles (loyer, transport, salaires, électricité…) -------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'autre',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  date DATE NOT NULL DEFAULT now()::date,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses member all" ON public.expenses;
CREATE POLICY "expenses member all" ON public.expenses FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id, auth.uid()))
  WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;

-- 2. Shifts d'ouverture/fermeture de caisse -----------------------------------
CREATE TABLE IF NOT EXISTS public.cash_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  float NUMERIC(14,2) NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  counted NUMERIC(14,2),
  note TEXT
);
ALTER TABLE public.cash_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shifts member all" ON public.cash_shifts;
CREATE POLICY "shifts member all" ON public.cash_shifts FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id, auth.uid()))
  WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_shifts TO authenticated;
GRANT ALL ON public.cash_shifts TO service_role;

-- 3. Carte fidélité publique (lecture minimale, ID aléatoire non devinable) ---
CREATE OR REPLACE FUNCTION public.loyalty_card(p_shop_id UUID, p_customer_id UUID)
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'ok', c.id IS NOT NULL,
    'shop_name', s.name,
    'logo_url', s.logo_url,
    'currency', s.currency,
    'name', c.name,
    'points', c.loyalty_points,
    'credit', c.credit_balance,
    'birthdate', c.birthdate,
    'since', c.created_at
  )
  FROM public.customers c
  JOIN public.shops s ON s.id = c.shop_id AND s.id = p_shop_id
  WHERE c.id = p_customer_id;
$$;
REVOKE EXECUTE ON FUNCTION public.loyalty_card(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.loyalty_card(uuid, uuid) TO anon, authenticated;
