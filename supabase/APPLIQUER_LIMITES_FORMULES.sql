-- ============================================================================
-- Limites des formules appliquées côté base de données
--   Essentiel : 1 boutique, 500 articles, 2 employés
--   Pro       : 3 boutiques, articles illimités, 10 employés
--   Sur mesure: illimité
-- Pendant l'essai gratuit (15 jours), la boutique a les droits du Pro.
-- À exécuter UNE FOIS dans Supabase > SQL Editor.
-- Les données existantes ne sont jamais supprimées : seuls les NOUVEAUX ajouts
-- au-delà de la limite sont refusés. Le super admin et le SQL Editor ne sont
-- pas concernés.
-- ============================================================================

-- 1. Palier réel d'une boutique -----------------------------------------------
CREATE OR REPLACE FUNCTION public.plan_tier(p_plan TEXT, p_trial_ends TIMESTAMPTZ, p_created TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN p_plan = 'sur-mesure'    THEN 'sur-mesure'
    WHEN p_plan = 'pro'           THEN 'pro'
    WHEN p_plan = 'essentiel_paid' THEN 'essentiel'
    -- plan 'essentiel' = essai gratuit : droits du Pro tant que l'essai court
    WHEN coalesce(p_trial_ends, p_created + interval '15 days') > now() THEN 'pro'
    ELSE 'essentiel'
  END
$$;

-- NULL = illimité
CREATE OR REPLACE FUNCTION public.plan_limit(p_tier TEXT, p_kind TEXT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_kind
    WHEN 'products'  THEN CASE p_tier WHEN 'essentiel' THEN 500 ELSE NULL END
    WHEN 'employees' THEN CASE p_tier WHEN 'essentiel' THEN 2 WHEN 'pro' THEN 10 ELSE NULL END
  END
$$;

-- 2. Articles : 500 pour l'Essentiel ----------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_product_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tier TEXT; v_lim INT; v_n INT;
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin() THEN RETURN NEW; END IF;
  SELECT public.plan_tier(plan, trial_ends_at, created_at) INTO v_tier
    FROM public.shops WHERE id = NEW.shop_id;
  v_lim := public.plan_limit(v_tier, 'products');
  IF v_lim IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_n FROM public.products WHERE shop_id = NEW.shop_id;
  IF v_n >= v_lim THEN
    RAISE EXCEPTION 'PLAN_LIMIT|products|%|%', v_lim, v_tier;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_products_plan_limit ON public.products;
CREATE TRIGGER trg_products_plan_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_limit();
REVOKE EXECUTE ON FUNCTION public.enforce_product_limit() FROM PUBLIC, anon, authenticated;

-- 3. Employés : 2 (Essentiel) / 10 (Pro) ------------------------------------
-- Remplace la version précédente (3 / 5 / 10) en gardant le reste à l'identique.
CREATE OR REPLACE FUNCTION public.create_employee(p_shop_id UUID, p_name TEXT, p_phone TEXT, p_role TEXT)
RETURNS JSON LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_tier TEXT; v_limit INT; v_count INT; v_pin TEXT; v_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_shop_manager(p_shop_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 OR length(p_name) > 120 THEN
    RAISE EXCEPTION 'Nom invalide';
  END IF;
  IF p_role NOT IN ('caissier','gerant','comptable','magasinier','commercial','superviseur') THEN
    RAISE EXCEPTION 'Rôle invalide';
  END IF;

  SELECT public.plan_tier(plan, trial_ends_at, created_at) INTO v_tier
    FROM public.shops WHERE id = p_shop_id;
  v_limit := public.plan_limit(v_tier, 'employees');
  IF v_limit IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.employees
     WHERE shop_id = p_shop_id AND is_active;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'PLAN_LIMIT|employees|%|%', v_limit, v_tier;
    END IF;
  END IF;

  v_pin := public._generate_pin();
  INSERT INTO public.employees (shop_id, name, phone, role)
  VALUES (p_shop_id, trim(p_name), nullif(trim(coalesce(p_phone, '')), ''), p_role)
  RETURNING id INTO v_id;
  INSERT INTO public.employee_credentials (employee_id, pin_hash)
  VALUES (v_id, extensions.crypt(v_pin, extensions.gen_salt('bf', 8)));

  RETURN json_build_object('id', v_id, 'pin', v_pin);
END; $$;

-- Réactiver un employé compte aussi dans la limite
CREATE OR REPLACE FUNCTION public.enforce_employee_reactivation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tier TEXT; v_lim INT; v_n INT;
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin() THEN RETURN NEW; END IF;
  IF NEW.is_active IS TRUE AND OLD.is_active IS NOT TRUE THEN
    SELECT public.plan_tier(plan, trial_ends_at, created_at) INTO v_tier
      FROM public.shops WHERE id = NEW.shop_id;
    v_lim := public.plan_limit(v_tier, 'employees');
    IF v_lim IS NOT NULL THEN
      SELECT count(*) INTO v_n FROM public.employees
       WHERE shop_id = NEW.shop_id AND is_active AND id <> NEW.id;
      IF v_n >= v_lim THEN
        RAISE EXCEPTION 'PLAN_LIMIT|employees|%|%', v_lim, v_tier;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_employee_reactivation ON public.employees;
CREATE TRIGGER trg_employee_reactivation
  BEFORE UPDATE OF is_active ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.enforce_employee_reactivation();
REVOKE EXECUTE ON FUNCTION public.enforce_employee_reactivation() FROM PUBLIC, anon, authenticated;

-- 4. Boutiques : 1 (Essentiel) / 3 (Pro), boutique en plus sur accord ---------
CREATE TABLE IF NOT EXISTS public.owner_extra_shops (
  owner_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  extra      INT NOT NULL DEFAULT 0 CHECK (extra >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_extra_shops ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.owner_extra_shops FROM anon, authenticated;
GRANT ALL ON public.owner_extra_shops TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_shop_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n INT; v_best_plan TEXT; v_tier TEXT; v_extra INT; v_cap INT;
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin() THEN RETURN NEW; END IF;

  SELECT count(*),
         CASE WHEN bool_or(plan = 'sur-mesure')     THEN 'sur-mesure'
              WHEN bool_or(plan = 'pro')            THEN 'pro'
              WHEN bool_or(plan = 'essentiel_paid') THEN 'essentiel_paid'
              ELSE NULL END
    INTO v_n, v_best_plan
    FROM public.shops WHERE owner_id = NEW.owner_id;

  IF v_n = 0 THEN RETURN NEW; END IF;  -- première boutique : toujours autorisée

  SELECT coalesce(max(extra), 0) INTO v_extra
    FROM public.owner_extra_shops WHERE owner_id = NEW.owner_id;

  v_tier := CASE v_best_plan WHEN 'sur-mesure' THEN 'sur-mesure'
                             WHEN 'pro' THEN 'pro' ELSE 'essentiel' END;
  v_cap := CASE v_tier WHEN 'sur-mesure' THEN NULL
                       WHEN 'pro' THEN 3 + v_extra
                       ELSE 1 + v_extra END;

  IF v_cap IS NOT NULL AND v_n >= v_cap THEN
    RAISE EXCEPTION 'PLAN_LIMIT|shops|%|%', v_cap, v_tier;
  END IF;

  -- Une boutique supplémentaire autorisée hérite de la formule payée :
  -- pas de nouvel essai gratuit, pas de nouvel abonnement.
  IF v_best_plan IS NOT NULL THEN
    NEW.plan := v_best_plan;
    NEW.trial_ends_at := NULL;
  END IF;
  RETURN NEW;
END; $$;

-- Le préfixe « zz » le fait tourner APRÈS shops_protect_insert (qui remet « essentiel »)
DROP TRIGGER IF EXISTS zz_shops_enforce_limit ON public.shops;
CREATE TRIGGER zz_shops_enforce_limit
  BEFORE INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.enforce_shop_limit();
REVOKE EXECUTE ON FUNCTION public.enforce_shop_limit() FROM PUBLIC, anon, authenticated;

-- Super admin : accorder des boutiques supplémentaires à un propriétaire
CREATE OR REPLACE FUNCTION public.admin_set_extra_shops(p_owner_id UUID, p_extra INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_extra IS NULL OR p_extra < 0 OR p_extra > 50 THEN RAISE EXCEPTION 'Valeur invalide'; END IF;
  INSERT INTO public.owner_extra_shops (owner_id, extra)
  VALUES (p_owner_id, p_extra)
  ON CONFLICT (owner_id) DO UPDATE SET extra = EXCLUDED.extra, updated_at = now();
  PERFORM public._admin_log('set_extra_shops', p_owner_id::TEXT, jsonb_build_object('extra', p_extra));
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_extra_shops(UUID, INT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_extra_shops(UUID, INT) TO authenticated;
