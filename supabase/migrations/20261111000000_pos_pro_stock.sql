-- ============================================================================
-- Caisse pro + stock avancé (2026-11-11)
--  - Ventes : montant reçu, monnaie, ventilation des paiements mixtes
--  - Transferts de stock entre boutiques d'un même propriétaire
--  - Réception marchandise fournisseur (stock + coût moyen pondéré)
--  - Inventaire physique avec application des écarts tracée
-- À exécuter UNE FOIS (CLI supabase db query --remote --yes -f).
-- ============================================================================

-- 1. Ventes : pièces d'un paiement professionnel ------------------------------
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(14,2);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS change_due NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payments JSONB; -- [{method,amount}] si mixte

-- 2. Transferts entre boutiques -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_shop UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  to_shop UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transfers member all" ON public.stock_transfers;
CREATE POLICY "transfers member all" ON public.stock_transfers FOR ALL TO authenticated
  USING (public.is_shop_member(from_shop, auth.uid()) OR public.is_shop_member(to_shop, auth.uid()))
  WITH CHECK (public.is_shop_member(from_shop, auth.uid()) OR public.is_shop_member(to_shop, auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfers TO service_role;

CREATE OR REPLACE FUNCTION public.transfer_stock(
  p_from_shop UUID, p_to_shop UUID, p_product_id UUID, p_qty NUMERIC, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prod RECORD; v_dest UUID; v_from_name TEXT; v_to_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;
  IF p_from_shop = p_to_shop THEN RAISE EXCEPTION 'Boutiques identiques'; END IF;
  IF NOT (public.is_shop_member(p_from_shop, auth.uid())
          AND public.is_shop_member(p_to_shop, auth.uid())) THEN
    RAISE EXCEPTION 'Il faut être membre des deux boutiques';
  END IF;

  SELECT name INTO v_from_name FROM public.shops WHERE id = p_from_shop;
  SELECT name INTO v_to_name  FROM public.shops WHERE id = p_to_shop;

  SELECT * INTO v_prod FROM public.products
   WHERE id = p_product_id AND shop_id = p_from_shop FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable dans la boutique source'; END IF;
  IF v_prod.stock < p_qty THEN RAISE EXCEPTION 'Stock insuffisant (disponible : %)', v_prod.stock; END IF;

  -- produit correspondant dans la destination : code-barres, puis réf, puis nom
  SELECT id INTO v_dest FROM public.products
   WHERE shop_id = p_to_shop
     AND ((v_prod.barcode IS NOT NULL AND v_prod.barcode <> '' AND barcode = v_prod.barcode)
       OR (v_prod.sku IS NOT NULL AND v_prod.sku <> '' AND sku = v_prod.sku))
   LIMIT 1;
  IF v_dest IS NULL THEN
    SELECT id INTO v_dest FROM public.products
     WHERE shop_id = p_to_shop AND lower(name) = lower(v_prod.name) LIMIT 1;
  END IF;
  IF v_dest IS NULL THEN
    INSERT INTO public.products (shop_id, name, sku, barcode, cost_price, sale_price, stock, unit)
    VALUES (p_to_shop, v_prod.name, NULLIF(v_prod.sku,''), NULLIF(v_prod.barcode,''),
            v_prod.cost_price, v_prod.sale_price, 0, v_prod.unit)
    RETURNING id INTO v_dest;
  END IF;

  UPDATE public.products SET stock = stock - p_qty, updated_at = now() WHERE id = p_product_id;
  UPDATE public.products SET stock = stock + p_qty, updated_at = now() WHERE id = v_dest;

  INSERT INTO public.stock_movements (shop_id, product_id, type, quantity, reason, created_by)
  VALUES (p_from_shop, p_product_id, 'out', p_qty,
          'Transfert → ' || v_to_name || COALESCE(' · ' || p_note, ''), auth.uid());
  INSERT INTO public.stock_movements (shop_id, product_id, type, quantity, reason, created_by)
  VALUES (p_to_shop, v_dest, 'in', p_qty,
          'Transfert ← ' || v_from_name || COALESCE(' · ' || p_note, ''), auth.uid());

  INSERT INTO public.stock_transfers (from_shop, to_shop, product_name, quantity, note, created_by)
  VALUES (p_from_shop, p_to_shop, v_prod.name, p_qty, p_note, auth.uid());
END; $$;

-- 3. Réception marchandise fournisseur ---------------------------------------
CREATE OR REPLACE FUNCTION public.receive_purchase(
  p_shop_id UUID, p_supplier_id UUID, p_lines JSONB, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_line RECORD; v_prod RECORD; v_sup_name TEXT; v_cost NUMERIC; v_new NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF NOT public.is_shop_member(p_shop_id, auth.uid()) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_lines IS NULL OR jsonb_array_length(p_lines) = 0 THEN RAISE EXCEPTION 'Aucune ligne'; END IF;

  SELECT name INTO v_sup_name FROM public.suppliers WHERE id = p_supplier_id AND shop_id = p_shop_id;
  IF v_sup_name IS NULL THEN v_sup_name := 'fournisseur'; END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    SELECT * INTO v_prod FROM public.products
     WHERE id = (v_line.value->>'product_id')::uuid AND shop_id = p_shop_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable : %', v_line.value->>'product_id'; END IF;
    IF (v_line.value->>'quantity')::numeric <= 0 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;

    v_cost := NULLIF(v_line.value->>'unit_cost','')::numeric;
    -- coût moyen pondéré si un nouveau prix d'achat est fourni
    IF v_cost IS NOT NULL THEN
      v_new := round((v_prod.stock * v_prod.cost_price + (v_line.value->>'quantity')::numeric * v_cost)
                     / NULLIF(v_prod.stock + (v_line.value->>'quantity')::numeric, 0), 2);
      UPDATE public.products
        SET stock = stock + (v_line.value->>'quantity')::numeric,
            cost_price = COALESCE(v_new, v_cost), updated_at = now()
        WHERE id = v_prod.id;
    ELSE
      UPDATE public.products
        SET stock = stock + (v_line.value->>'quantity')::numeric, updated_at = now()
        WHERE id = v_prod.id;
    END IF;

    INSERT INTO public.stock_movements (shop_id, product_id, type, quantity, reason, created_by)
    VALUES (p_shop_id, v_prod.id, 'in', (v_line.value->>'quantity')::numeric,
            'Réception ' || v_sup_name || COALESCE(' · ' || p_note, ''), auth.uid());
  END LOOP;
END; $$;

-- 4. Inventaire physique -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',          -- draft | applied
  lines JSONB NOT NULL DEFAULT '[]',             -- [{product_id,name,counted,stock_before}]
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "counts member all" ON public.stock_counts;
CREATE POLICY "counts member all" ON public.stock_counts FOR ALL TO authenticated
  USING (public.is_shop_member(shop_id, auth.uid()))
  WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_counts TO authenticated;
GRANT ALL ON public.stock_counts TO service_role;

CREATE OR REPLACE FUNCTION public.apply_stock_count(p_count_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cnt RECORD; v_line RECORD; v_stock NUMERIC; v_delta NUMERIC; v_applied INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT * INTO v_cnt FROM public.stock_counts WHERE id = p_count_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventaire introuvable'; END IF;
  IF v_cnt.status <> 'draft' THEN RAISE EXCEPTION 'Inventaire déjà appliqué'; END IF;
  IF NOT public.is_shop_member(v_cnt.shop_id, auth.uid()) THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_cnt.lines) LOOP
    SELECT stock INTO v_stock FROM public.products
     WHERE id = (v_line.value->>'product_id')::uuid AND shop_id = v_cnt.shop_id FOR UPDATE;
    IF v_stock IS NULL THEN CONTINUE; END IF;
    v_delta := (v_line.value->>'counted')::numeric - v_stock;
    IF v_delta = 0 THEN CONTINUE; END IF;

    UPDATE public.products SET stock = stock + v_delta, updated_at = now()
     WHERE id = (v_line.value->>'product_id')::uuid;
    INSERT INTO public.stock_movements (shop_id, product_id, type, quantity, reason, created_by)
    VALUES (v_cnt.shop_id, (v_line.value->>'product_id')::uuid,
            CASE WHEN v_delta > 0 THEN 'in' ELSE 'out' END, abs(v_delta),
            'Inventaire ' || to_char(now(), 'DD/MM/YYYY') || COALESCE(' · ' || v_cnt.note, ''),
            auth.uid());
    v_applied := v_applied + 1;
  END LOOP;

  UPDATE public.stock_counts SET status = 'applied', applied_at = now() WHERE id = p_count_id;
  RETURN v_applied;
END; $$;

-- 5. Permissions d'exécution ---------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.transfer_stock(uuid,uuid,uuid,numeric,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.transfer_stock(uuid,uuid,uuid,numeric,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.receive_purchase(uuid,uuid,jsonb,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.receive_purchase(uuid,uuid,jsonb,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_stock_count(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.apply_stock_count(uuid) TO authenticated;
