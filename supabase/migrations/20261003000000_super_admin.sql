-- ============================================================
-- SUPER ADMIN BoutikBF
-- Un espace réservé au propriétaire de la plateforme pour gérer
-- boutiques, utilisateurs et abonnements sans ouvrir Supabase.
-- ============================================================

-- 1. Table des super admins ---------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM anon, authenticated;
GRANT ALL ON public.platform_admins TO service_role;
-- Aucune policy : seules les fonctions SECURITY DEFINER y accèdent.

-- 2. Fonction : suis-je super admin ? -----------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 3. Nouvelles colonnes sur les boutiques -------------------
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Notes privées du super admin : table séparée (jamais lisible par les propriétaires de boutique)
CREATE TABLE IF NOT EXISTS public.shop_admin_notes (
  shop_id UUID PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_admin_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shop_admin_notes FROM anon, authenticated;
GRANT ALL ON public.shop_admin_notes TO service_role;

-- Un propriétaire ne doit pas pouvoir se prolonger lui-même
-- ni se dé-suspendre : on bloque ces colonnes hors super admin.
CREATE OR REPLACE FUNCTION public.protect_shop_admin_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.is_suspended := OLD.is_suspended;
    NEW.plan := OLD.plan;
    NEW.owner_id := OLD.owner_id;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS shops_protect_admin_columns ON public.shops;
CREATE TRIGGER shops_protect_admin_columns
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.protect_shop_admin_columns();

-- À la création, un utilisateur normal démarre toujours en essai "essentiel"
-- (empêche de s'attribuer le plan pro via l'API).
CREATE OR REPLACE FUNCTION public.protect_shop_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin() THEN
    NEW.plan := 'essentiel';
    NEW.trial_ends_at := NULL;
    NEW.is_suspended := false;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS shops_protect_insert ON public.shops;
CREATE TRIGGER shops_protect_insert
  BEFORE INSERT ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.protect_shop_insert();

REVOKE EXECUTE ON FUNCTION public.protect_shop_admin_columns() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_shop_insert() FROM PUBLIC, anon, authenticated;

-- 4. Journal d'audit ----------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
DROP POLICY IF EXISTS "audit super admin read" ON public.admin_audit_log;
CREATE POLICY "audit super admin read" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public._admin_log(p_action TEXT, p_target TEXT, p_details JSONB DEFAULT NULL)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.admin_audit_log (admin_id, action, target, details)
  VALUES (auth.uid(), p_action, p_target, p_details);
$$;
REVOKE EXECUTE ON FUNCTION public._admin_log(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- 5. Le super admin voit et modifie toutes les données ------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','shops','shop_members','categories','products','customers',
    'suppliers','sales','sale_items','stock_movements','employees',
    'employee_messages','imported_data'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "super admin all" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "super admin all" ON public.%I FOR ALL TO authenticated
         USING (public.is_super_admin()) WITH CHECK (public.is_super_admin())', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- 6. Vue d'ensemble -----------------------------------------
CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE r JSON;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT json_build_object(
    'shops',            (SELECT count(*) FROM public.shops),
    'users',            (SELECT count(*) FROM auth.users),
    'products',         (SELECT count(*) FROM public.products),
    'sales',            (SELECT count(*) FROM public.sales),
    'sales_total',      (SELECT coalesce(sum(total), 0) FROM public.sales WHERE status = 'completed'),
    'shops_7d',         (SELECT count(*) FROM public.shops WHERE created_at > now() - interval '7 days'),
    'users_7d',         (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    'suspended',        (SELECT count(*) FROM public.shops WHERE is_suspended),
    'plan_essentiel',   (SELECT count(*) FROM public.shops WHERE plan = 'essentiel'),
    'plan_essentiel_paid', (SELECT count(*) FROM public.shops WHERE plan = 'essentiel_paid'),
    'plan_pro',         (SELECT count(*) FROM public.shops WHERE plan = 'pro'),
    'plan_sur_mesure',  (SELECT count(*) FROM public.shops WHERE plan = 'sur-mesure'),
    'trials_expired',   (SELECT count(*) FROM public.shops
                           WHERE plan = 'essentiel'
                             AND coalesce(trial_ends_at, created_at + interval '15 days') < now()),
    'trials_ending_3d', (SELECT count(*) FROM public.shops
                           WHERE plan = 'essentiel'
                             AND coalesce(trial_ends_at, created_at + interval '15 days')
                                 BETWEEN now() AND now() + interval '3 days')
  ) INTO r;
  RETURN r;
END; $$;

-- 7. Liste des boutiques ------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_shops()
RETURNS TABLE (
  id UUID, name TEXT, slug TEXT, plan TEXT, owner_id UUID, owner_email TEXT,
  owner_name TEXT, phone TEXT, created_at TIMESTAMPTZ, trial_ends_at TIMESTAMPTZ,
  is_suspended BOOLEAN, admin_notes TEXT, members_count BIGINT, products_count BIGINT,
  sales_count BIGINT, sales_total NUMERIC, last_sale_at TIMESTAMPTZ, last_sign_in_at TIMESTAMPTZ
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT s.id, s.name, s.slug, s.plan, s.owner_id,
         u.email::TEXT, p.full_name, s.phone, s.created_at, s.trial_ends_at,
         s.is_suspended, n.notes,
         (SELECT count(*) FROM public.shop_members m WHERE m.shop_id = s.id),
         (SELECT count(*) FROM public.products pr WHERE pr.shop_id = s.id),
         (SELECT count(*) FROM public.sales sa WHERE sa.shop_id = s.id),
         (SELECT coalesce(sum(sa.total), 0) FROM public.sales sa
            WHERE sa.shop_id = s.id AND sa.status = 'completed'),
         (SELECT max(sa.created_at) FROM public.sales sa WHERE sa.shop_id = s.id),
         u.last_sign_in_at
  FROM public.shops s
  LEFT JOIN auth.users u ON u.id = s.owner_id
  LEFT JOIN public.profiles p ON p.id = s.owner_id
  LEFT JOIN public.shop_admin_notes n ON n.shop_id = s.id
  ORDER BY s.created_at DESC;
END; $$;

-- 8. Liste des utilisateurs ---------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID, email TEXT, full_name TEXT, phone TEXT, created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ, banned_until TIMESTAMPTZ, shops_count BIGINT, is_super_admin BOOLEAN
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  SELECT u.id, u.email::TEXT, p.full_name, p.phone, u.created_at, u.last_sign_in_at,
         u.banned_until,
         (SELECT count(*) FROM public.shops s WHERE s.owner_id = u.id),
         EXISTS (SELECT 1 FROM public.platform_admins a WHERE a.user_id = u.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END; $$;

-- 9. Actions sur les boutiques ------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_shop_plan(p_shop_id UUID, p_plan TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old_plan TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_plan NOT IN ('essentiel', 'essentiel_paid', 'pro', 'sur-mesure') THEN
    RAISE EXCEPTION 'Plan inconnu : %', p_plan;
  END IF;
  SELECT plan INTO old_plan FROM public.shops WHERE id = p_shop_id;
  UPDATE public.shops SET plan = p_plan, updated_at = now() WHERE id = p_shop_id;
  PERFORM public._admin_log('set_plan', p_shop_id::TEXT,
    jsonb_build_object('from', old_plan, 'to', p_plan));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_extend_trial(p_shop_id UUID, p_days INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_days < 1 OR p_days > 365 THEN RAISE EXCEPTION 'Durée invalide'; END IF;
  UPDATE public.shops
     SET trial_ends_at = greatest(now(), coalesce(trial_ends_at, created_at + interval '15 days'))
                         + make_interval(days => p_days),
         updated_at = now()
   WHERE id = p_shop_id;
  PERFORM public._admin_log('extend_trial', p_shop_id::TEXT, jsonb_build_object('days', p_days));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_shop_suspended(p_shop_id UUID, p_suspended BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  UPDATE public.shops SET is_suspended = p_suspended, updated_at = now() WHERE id = p_shop_id;
  PERFORM public._admin_log(CASE WHEN p_suspended THEN 'suspend_shop' ELSE 'unsuspend_shop' END,
    p_shop_id::TEXT);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_shop_notes(p_shop_id UUID, p_notes TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  INSERT INTO public.shop_admin_notes (shop_id, notes, updated_at)
  VALUES (p_shop_id, p_notes, now())
  ON CONFLICT (shop_id) DO UPDATE SET notes = EXCLUDED.notes, updated_at = now();
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_shop(p_shop_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE shop_name TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT name INTO shop_name FROM public.shops WHERE id = p_shop_id;
  DELETE FROM public.shops WHERE id = p_shop_id;
  PERFORM public._admin_log('delete_shop', p_shop_id::TEXT, jsonb_build_object('name', shop_name));
END; $$;

-- 10. Actions sur les utilisateurs --------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_banned(p_user_id UUID, p_banned BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'Tu ne peux pas te bloquer toi-même'; END IF;
  UPDATE auth.users
     SET banned_until = CASE WHEN p_banned THEN 'infinity'::timestamptz ELSE NULL END
   WHERE id = p_user_id;
  PERFORM public._admin_log(CASE WHEN p_banned THEN 'ban_user' ELSE 'unban_user' END, p_user_id::TEXT);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE u_email TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'Tu ne peux pas te supprimer toi-même'; END IF;
  SELECT email::TEXT INTO u_email FROM auth.users WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
  PERFORM public._admin_log('delete_user', p_user_id::TEXT, jsonb_build_object('email', u_email));
END; $$;

-- 11. Gestion des super admins ------------------------------
CREATE OR REPLACE FUNCTION public.admin_grant_super_admin(p_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE uid UUID;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF uid IS NULL THEN RAISE EXCEPTION 'Aucun compte avec cet email'; END IF;
  INSERT INTO public.platform_admins (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  PERFORM public._admin_log('grant_super_admin', uid::TEXT, jsonb_build_object('email', p_email));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_super_admin(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF (SELECT count(*) FROM public.platform_admins) <= 1 THEN
    RAISE EXCEPTION 'Impossible de retirer le dernier super admin';
  END IF;
  DELETE FROM public.platform_admins WHERE user_id = p_user_id;
  PERFORM public._admin_log('revoke_super_admin', p_user_id::TEXT);
END; $$;

-- 12. Droits d'exécution : réservés aux utilisateurs connectés
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'admin_overview()', 'admin_list_shops()', 'admin_list_users()',
    'admin_set_shop_plan(uuid,text)', 'admin_extend_trial(uuid,int)',
    'admin_set_shop_suspended(uuid,boolean)', 'admin_set_shop_notes(uuid,text)',
    'admin_delete_shop(uuid)', 'admin_set_user_banned(uuid,boolean)',
    'admin_delete_user(uuid)', 'admin_grant_super_admin(text)', 'admin_revoke_super_admin(uuid)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

-- ============================================================
-- ÉTAPE UNIQUE À FAIRE UNE SEULE FOIS (SQL Editor de Supabase) :
-- te nommer super admin. Remplace par TON email de connexion.
--
--   INSERT INTO public.platform_admins (user_id)
--   SELECT id FROM auth.users WHERE lower(email) = lower('TON_EMAIL@exemple.com');
--
-- Ensuite tout se gère depuis l'app, sur /superadmin.
-- ============================================================
