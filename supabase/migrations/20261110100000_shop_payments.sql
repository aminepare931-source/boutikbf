-- ============================================================================
-- Registre des paiements d'abonnement (super admin)
-- Trace ce que chaque boutique a payé : montant, date, moyen, formule, période.
-- À exécuter UNE FOIS (déjà appliqué via CLI le 2026-11-10).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'other',          -- orange_money | moov_money | wave | cash | bank | other
  plan TEXT,                                     -- formule payée : essentiel_paid | pro | sur-mesure
  period_start DATE,
  period_end DATE,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_payments ENABLE ROW LEVEL SECURITY;
-- Personne n'y accède directement : uniquement via les fonctions SECURITY DEFINER.
REVOKE ALL ON public.shop_payments FROM anon, authenticated;
GRANT ALL ON public.shop_payments TO service_role;

-- 1. Liste + résumé ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_shop_payments(p_shop_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE r JSON;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  WITH p AS (SELECT * FROM public.shop_payments WHERE shop_id = p_shop_id)
  SELECT json_build_object(
    'payments', coalesce((SELECT json_agg(json_build_object(
        'id', id, 'amount', amount, 'method', method, 'plan', plan,
        'period_start', period_start, 'period_end', period_end,
        'paid_at', paid_at, 'note', note, 'created_at', created_at
      ) ORDER BY paid_at DESC) FROM p), '[]'::json),
    'summary', (SELECT json_build_object(
        'count', count(*),
        'total', coalesce(sum(amount), 0),
        'total_12m', coalesce(sum(amount) FILTER (WHERE paid_at >= now() - interval '365 days'), 0),
        'last_paid_at', max(paid_at)
      ) FROM p)
  ) INTO r;
  RETURN r;
END; $$;

-- 2. Enregistrer un paiement ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_add_shop_payment(
  p_shop_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'other',
  p_plan TEXT DEFAULT NULL,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL,
  p_paid_at TIMESTAMPTZ DEFAULT now(),
  p_note TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Montant invalide'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id) THEN
    RAISE EXCEPTION 'Boutique introuvable';
  END IF;

  INSERT INTO public.shop_payments (shop_id, amount, method, plan, period_start, period_end, paid_at, note, created_by)
  VALUES (p_shop_id, p_amount, p_method, p_plan, p_period_start, p_period_end,
          coalesce(p_paid_at, now()), p_note, auth.uid())
  RETURNING id INTO new_id;

  PERFORM public._admin_log('record_payment', p_shop_id::TEXT,
    jsonb_build_object('amount', p_amount, 'method', p_method, 'plan', p_plan));
  RETURN new_id;
END; $$;

-- 3. Corriger / supprimer un paiement ------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_shop_payment(p_payment_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE pid UUID; sid UUID;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  DELETE FROM public.shop_payments WHERE id = p_payment_id
    RETURNING id, shop_id INTO pid, sid;
  IF pid IS NULL THEN RAISE EXCEPTION 'Paiement introuvable'; END IF;
  PERFORM public._admin_log('delete_payment', sid::TEXT, jsonb_build_object('payment_id', p_payment_id));
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_shop_payments(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_shop_payments(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_add_shop_payment(uuid,numeric,text,text,date,date,timestamptz,text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_add_shop_payment(uuid,numeric,text,text,date,date,timestamptz,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_shop_payment(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_delete_shop_payment(uuid) TO authenticated;
