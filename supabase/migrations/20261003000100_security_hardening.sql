-- ============================================================
-- DURCISSEMENT SÉCURITÉ BoutikBF
--  1. Les PIN employés ne sont plus lisibles (hachés + table à part)
--  2. Connexion employé côté serveur (jeton + limitation d'essais)
--  3. Accès employé aux données par jeton, avec droits par rôle
--  4. Chat interne fermé aux inconnus
--  5. Fonctions SECURITY DEFINER : contrôle d'accès ajouté
--  6. Storage : plus d'écriture libre dans shop-logos
--  7. Droits "anon" réduits au strict nécessaire
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- 0. Outils : normalisation des rôles, droits gérant
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._norm_role(r TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(r, ''))
    WHEN 'cashier' THEN 'caissier'
    WHEN 'manager' THEN 'gerant'
    WHEN 'accountant' THEN 'comptable'
    ELSE lower(coalesce(r, ''))
  END
$$;

CREATE OR REPLACE FUNCTION public.is_shop_manager(_shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops s WHERE s.id = _shop_id AND s.owner_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.shop_members m
                  WHERE m.shop_id = _shop_id AND m.user_id = auth.uid() AND m.role IN ('admin', 'manager'))
      OR public.is_super_admin();
$$;

-- ------------------------------------------------------------
-- 1. PIN : table séparée et hachée
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_credentials (
  employee_id UUID PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employee_credentials FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.employee_credentials TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'pin') THEN
    INSERT INTO public.employee_credentials (employee_id, pin_hash)
    SELECT id, extensions.crypt(pin, extensions.gen_salt('bf', 8))
      FROM public.employees WHERE pin IS NOT NULL
    ON CONFLICT (employee_id) DO NOTHING;
    ALTER TABLE public.employees DROP COLUMN pin;
  END IF;
END $$;

-- Valeurs de rôle autorisées (anciens noms inclus, lignes existantes non vérifiées)
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check CHECK (
  role IN ('caissier','gerant','comptable','magasinier','commercial','superviseur','cashier','manager','accountant')
) NOT VALID;

-- ------------------------------------------------------------
-- 2. Sessions & connexion employé
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_sessions (
  token_hash TEXT PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee ON public.employee_sessions(employee_id);
ALTER TABLE public.employee_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employee_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.employee_sessions TO service_role;

CREATE TABLE IF NOT EXISTS public.employee_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  login_key TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employee_attempts ON public.employee_login_attempts(login_key, attempted_at);
ALTER TABLE public.employee_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employee_login_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.employee_login_attempts TO service_role;

-- Contexte employé déduit du jeton envoyé dans l'en-tête x-employee-token
CREATE OR REPLACE FUNCTION public.employee_ctx()
RETURNS TABLE (employee_id UUID, shop_id UUID, role TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE h TEXT; tok TEXT;
BEGIN
  BEGIN h := current_setting('request.headers', true); EXCEPTION WHEN OTHERS THEN h := NULL; END;
  IF h IS NULL OR h = '' THEN RETURN; END IF;
  BEGIN tok := (h::json) ->> 'x-employee-token'; EXCEPTION WHEN OTHERS THEN RETURN; END;
  IF tok IS NULL OR length(tok) < 32 OR length(tok) > 128 THEN RETURN; END IF;
  RETURN QUERY
    SELECT s.employee_id, e.shop_id, public._norm_role(e.role)
      FROM public.employee_sessions s
      JOIN public.employees e ON e.id = s.employee_id
     WHERE s.token_hash = encode(extensions.digest(tok, 'sha256'), 'hex')
       AND s.expires_at > now()
       AND e.is_active;
END; $$;

CREATE OR REPLACE FUNCTION public.employee_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.employee_id FROM public.employee_ctx() c LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.employee_shop_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.shop_id FROM public.employee_ctx() c LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.employee_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.role FROM public.employee_ctx() c LIMIT 1 $$;

-- Connexion : nom + PIN. Renvoie {ok:false,...} (et non une exception) pour que
-- l'échec soit bien enregistré dans le compteur anti force-brute.
CREATE OR REPLACE FUNCTION public.employee_login(p_name TEXT, p_pin TEXT)
RETURNS JSON LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  k TEXT := lower(trim(coalesce(p_name, '')));
  r RECORD;
  tok TEXT;
  fails INT;
  exp TIMESTAMPTZ := now() + interval '12 hours';
BEGIN
  IF k = '' OR length(k) > 120 OR p_pin IS NULL OR p_pin !~ '^[0-9]{4,8}$' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_credentials');
  END IF;

  SELECT count(*) INTO fails FROM public.employee_login_attempts
   WHERE login_key = k AND NOT success AND attempted_at > now() - interval '15 minutes';
  IF fails >= 5 THEN
    RETURN json_build_object('ok', false, 'error', 'too_many_attempts');
  END IF;

  FOR r IN
    SELECT e.id, e.name, e.role, e.shop_id, c.pin_hash
      FROM public.employees e
      JOIN public.employee_credentials c ON c.employee_id = e.id
     WHERE lower(trim(e.name)) = k AND e.is_active
  LOOP
    IF r.pin_hash = extensions.crypt(p_pin, r.pin_hash) THEN
      tok := encode(extensions.gen_random_bytes(32), 'hex');
      INSERT INTO public.employee_sessions (token_hash, employee_id, shop_id, role, expires_at)
      VALUES (encode(extensions.digest(tok, 'sha256'), 'hex'), r.id, r.shop_id, public._norm_role(r.role), exp);
      -- réussite : on efface les échecs et on fait le ménage
      DELETE FROM public.employee_login_attempts WHERE login_key = k;
      DELETE FROM public.employee_sessions WHERE expires_at < now() - interval '1 day';
      RETURN json_build_object(
        'ok', true, 'token', tok, 'expires_at', exp,
        'employee', json_build_object('id', r.id, 'name', r.name,
                                      'role', public._norm_role(r.role), 'shop_id', r.shop_id));
    END IF;
  END LOOP;

  INSERT INTO public.employee_login_attempts (login_key, success) VALUES (k, false);
  DELETE FROM public.employee_login_attempts WHERE attempted_at < now() - interval '1 day';
  RETURN json_build_object('ok', false, 'error', 'invalid_credentials');
END; $$;

CREATE OR REPLACE FUNCTION public.employee_logout(p_token TEXT)
RETURNS VOID LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
  DELETE FROM public.employee_sessions
   WHERE token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

-- ------------------------------------------------------------
-- 2b. Création / réinitialisation de PIN (gérants uniquement)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._generate_pin()
RETURNS TEXT LANGUAGE sql VOLATILE SET search_path = public, extensions AS $$
  SELECT lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 1000000)::TEXT, 6, '0')
$$;

CREATE OR REPLACE FUNCTION public.create_employee(p_shop_id UUID, p_name TEXT, p_phone TEXT, p_role TEXT)
RETURNS JSON LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_plan TEXT; v_limit INT; v_count INT; v_pin TEXT; v_id UUID;
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

  SELECT plan INTO v_plan FROM public.shops WHERE id = p_shop_id;
  v_limit := CASE v_plan WHEN 'essentiel' THEN 3 WHEN 'essentiel_paid' THEN 5 WHEN 'pro' THEN 10 ELSE 999 END;
  SELECT count(*) INTO v_count FROM public.employees WHERE shop_id = p_shop_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite de % employés atteinte pour votre formule', v_limit;
  END IF;

  v_pin := public._generate_pin();
  INSERT INTO public.employees (shop_id, name, phone, role)
  VALUES (p_shop_id, trim(p_name), nullif(trim(coalesce(p_phone, '')), ''), p_role)
  RETURNING id INTO v_id;
  INSERT INTO public.employee_credentials (employee_id, pin_hash)
  VALUES (v_id, extensions.crypt(v_pin, extensions.gen_salt('bf', 8)));

  RETURN json_build_object('id', v_id, 'pin', v_pin);
END; $$;

CREATE OR REPLACE FUNCTION public.reset_employee_pin(p_employee_id UUID)
RETURNS JSON LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_shop UUID; v_pin TEXT;
BEGIN
  SELECT shop_id INTO v_shop FROM public.employees WHERE id = p_employee_id;
  IF v_shop IS NULL OR auth.uid() IS NULL OR NOT public.is_shop_manager(v_shop) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  v_pin := public._generate_pin();
  INSERT INTO public.employee_credentials (employee_id, pin_hash)
  VALUES (p_employee_id, extensions.crypt(v_pin, extensions.gen_salt('bf', 8)))
  ON CONFLICT (employee_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = now();
  DELETE FROM public.employee_sessions WHERE employee_id = p_employee_id;
  DELETE FROM public.employee_login_attempts
   WHERE login_key = (SELECT lower(trim(name)) FROM public.employees WHERE id = p_employee_id);
  RETURN json_build_object('pin', v_pin);
END; $$;

-- Ajustement atomique du stock (évite les écrasements quand 2 caisses vendent en même temps)
CREATE OR REPLACE FUNCTION public.adjust_stock(p_product_id UUID, p_delta NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_shop UUID; v_new NUMERIC;
BEGIN
  SELECT shop_id INTO v_shop FROM public.products WHERE id = p_product_id;
  IF v_shop IS NULL THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
  IF NOT (
    (auth.uid() IS NOT NULL AND (public.is_shop_member(v_shop, auth.uid()) OR public.is_super_admin()))
    OR (v_shop = public.employee_shop_id()
        AND public.employee_role() IN ('caissier','commercial','gerant','superviseur','magasinier'))
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  UPDATE public.products SET stock = stock + p_delta, updated_at = now()
   WHERE id = p_product_id RETURNING stock INTO v_new;
  RETURN v_new;
END; $$;

-- ------------------------------------------------------------
-- 3. Qui a fait la vente ? (les employés ne sont pas des comptes Supabase)
-- ------------------------------------------------------------
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_employee ON public.sales(employee_id);

CREATE OR REPLACE FUNCTION public.sales_set_employee()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL AND public.employee_id() IS NOT NULL THEN
    NEW.employee_id := public.employee_id();
    NEW.cashier_id := NULL;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_sales_set_employee ON public.sales;
CREATE TRIGGER trg_sales_set_employee BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sales_set_employee();

-- Un employé ne peut changer que le stock d'un produit
CREATE OR REPLACE FUNCTION public.products_employee_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL AND public.employee_id() IS NOT NULL THEN
    IF (to_jsonb(NEW) - 'stock' - 'updated_at' - 'search_vector')
       IS DISTINCT FROM (to_jsonb(OLD) - 'stock' - 'updated_at' - 'search_vector') THEN
      RAISE EXCEPTION 'Un employé ne peut modifier que le stock';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_products_employee_guard ON public.products;
CREATE TRIGGER trg_products_employee_guard BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_employee_guard();

-- Messages du chat : le nom et le rôle viennent du jeton (pas falsifiables)
CREATE OR REPLACE FUNCTION public.messages_set_sender()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL AND public.employee_id() IS NOT NULL THEN
    SELECT e.name, public._norm_role(e.role) INTO NEW.employee_name, NEW.employee_role
      FROM public.employees e WHERE e.id = public.employee_id();
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_messages_set_sender ON public.employee_messages;
CREATE TRIGGER trg_messages_set_sender BEFORE INSERT ON public.employee_messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_set_sender();

ALTER TABLE public.employee_messages DROP CONSTRAINT IF EXISTS employee_messages_len;
ALTER TABLE public.employee_messages ADD CONSTRAINT employee_messages_len
  CHECK (char_length(message) BETWEEN 1 AND 2000) NOT VALID;

-- ------------------------------------------------------------
-- 4. Politiques : on repart de zéro pour employees et employee_messages
-- ------------------------------------------------------------
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies
              WHERE schemaname = 'public' AND tablename IN ('employees', 'employee_messages')
                AND policyname <> 'super admin all'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- employees : membres de la boutique en lecture, gérants en modification
CREATE POLICY "employees members read" ON public.employees FOR SELECT TO authenticated
  USING (public.is_shop_member(shop_id, auth.uid()) OR public.is_shop_manager(shop_id));
CREATE POLICY "employees managers update" ON public.employees FOR UPDATE TO authenticated
  USING (public.is_shop_manager(shop_id)) WITH CHECK (public.is_shop_manager(shop_id));
CREATE POLICY "employees managers delete" ON public.employees FOR DELETE TO authenticated
  USING (public.is_shop_manager(shop_id));
CREATE POLICY "employees token read" ON public.employees FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id())
         AND (SELECT public.employee_role()) IN ('gerant', 'superviseur'));

-- employee_messages
CREATE POLICY "messages members read" ON public.employee_messages FOR SELECT TO authenticated
  USING (public.is_shop_member(shop_id, auth.uid()));
CREATE POLICY "messages members write" ON public.employee_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
CREATE POLICY "messages managers delete" ON public.employee_messages FOR DELETE TO authenticated
  USING (public.is_shop_manager(shop_id));
CREATE POLICY "messages token read" ON public.employee_messages FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id()));
CREATE POLICY "messages token write" ON public.employee_messages FOR INSERT TO anon
  WITH CHECK (shop_id = (SELECT public.employee_shop_id()));

-- Accès des employés (jeton) aux données de leur boutique, selon leur rôle
DROP POLICY IF EXISTS "emp shops read" ON public.shops;
CREATE POLICY "emp shops read" ON public.shops FOR SELECT TO anon
  USING (id = (SELECT public.employee_shop_id()));

DROP POLICY IF EXISTS "emp categories read" ON public.categories;
CREATE POLICY "emp categories read" ON public.categories FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id()));

DROP POLICY IF EXISTS "emp products read" ON public.products;
CREATE POLICY "emp products read" ON public.products FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id()));
DROP POLICY IF EXISTS "emp products stock" ON public.products;
CREATE POLICY "emp products stock" ON public.products FOR UPDATE TO anon
  USING (shop_id = (SELECT public.employee_shop_id())
         AND (SELECT public.employee_role()) IN ('caissier','commercial','gerant','superviseur','magasinier'))
  WITH CHECK (shop_id = (SELECT public.employee_shop_id()));

DROP POLICY IF EXISTS "emp customers read" ON public.customers;
CREATE POLICY "emp customers read" ON public.customers FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id())
         AND (SELECT public.employee_role()) IN ('caissier','gerant','comptable','commercial','superviseur'));

DROP POLICY IF EXISTS "emp suppliers read" ON public.suppliers;
CREATE POLICY "emp suppliers read" ON public.suppliers FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id())
         AND (SELECT public.employee_role()) IN ('gerant','magasinier','superviseur'));

DROP POLICY IF EXISTS "emp sales read" ON public.sales;
CREATE POLICY "emp sales read" ON public.sales FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id())
         AND (SELECT public.employee_role()) IN ('caissier','gerant','comptable','commercial','superviseur'));
DROP POLICY IF EXISTS "emp sales insert" ON public.sales;
CREATE POLICY "emp sales insert" ON public.sales FOR INSERT TO anon
  WITH CHECK (shop_id = (SELECT public.employee_shop_id())
              AND (SELECT public.employee_role()) IN ('caissier','gerant','commercial','superviseur'));

DROP POLICY IF EXISTS "emp sale_items read" ON public.sale_items;
CREATE POLICY "emp sale_items read" ON public.sale_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id));
DROP POLICY IF EXISTS "emp sale_items insert" ON public.sale_items;
CREATE POLICY "emp sale_items insert" ON public.sale_items FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id
                        AND s.shop_id = (SELECT public.employee_shop_id())
                        AND s.employee_id = (SELECT public.employee_id())));

DROP POLICY IF EXISTS "emp stock_movements read" ON public.stock_movements;
CREATE POLICY "emp stock_movements read" ON public.stock_movements FOR SELECT TO anon
  USING (shop_id = (SELECT public.employee_shop_id())
         AND (SELECT public.employee_role()) IN ('gerant','comptable','magasinier','superviseur'));
DROP POLICY IF EXISTS "emp stock_movements insert" ON public.stock_movements;
CREATE POLICY "emp stock_movements insert" ON public.stock_movements FOR INSERT TO anon
  WITH CHECK (shop_id = (SELECT public.employee_shop_id())
              AND (SELECT public.employee_role()) IN ('caissier','commercial','gerant','superviseur','magasinier'));

-- ------------------------------------------------------------
-- 5. Fonctions de classification : vérification d'appartenance
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_classify_product' AND pronamespace = 'public'::regnamespace)
     AND NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = '_auto_classify_product_internal' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.auto_classify_product(UUID) RENAME TO _auto_classify_product_internal;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_default_categories' AND pronamespace = 'public'::regnamespace)
     AND NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = '_generate_default_categories_internal' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.generate_default_categories(UUID) RENAME TO _generate_default_categories_internal;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.auto_classify_product(p_product_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_shop UUID;
BEGIN
  SELECT shop_id INTO v_shop FROM public.products WHERE id = p_product_id;
  IF v_shop IS NULL THEN RETURN NULL; END IF;
  IF auth.uid() IS NULL OR NOT (public.is_shop_member(v_shop, auth.uid()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN public._auto_classify_product_internal(p_product_id);
END; $$;

CREATE OR REPLACE FUNCTION public.auto_classify_shop_products(p_shop_id UUID)
RETURNS TABLE (product_id UUID, category_id UUID, category_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_product RECORD; v_cat_id UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_shop_member(p_shop_id, auth.uid()) OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  FOR v_product IN SELECT p.id FROM public.products p WHERE p.shop_id = p_shop_id AND p.category_id IS NULL LOOP
    v_cat_id := public._auto_classify_product_internal(v_product.id);
    IF v_cat_id IS NOT NULL THEN
      product_id := v_product.id;
      category_id := v_cat_id;
      SELECT c.name INTO category_name FROM public.categories c WHERE c.id = v_cat_id;
      RETURN NEXT;
    END IF;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_default_categories(p_shop_id UUID)
RETURNS SETOF public.categories LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_shop_manager(p_shop_id) OR public.is_shop_member(p_shop_id, auth.uid())) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY SELECT * FROM public._generate_default_categories_internal(p_shop_id);
END; $$;

-- Le déclencheur d'insertion appelle la version interne (sans contrôle d'utilisateur)
CREATE OR REPLACE FUNCTION public.trigger_auto_classify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    PERFORM public._auto_classify_product_internal(NEW.id);
  END IF;
  RETURN NEW;
END; $$;

-- ------------------------------------------------------------
-- 6. Storage : plus d'écriture libre dans shop-logos
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "shop-logos authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "shop-logos authenticated update" ON storage.objects;

-- ------------------------------------------------------------
-- 7. Droits (GRANT) : "anon" réduit au strict nécessaire
-- ------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

GRANT SELECT ON public.shops, public.categories, public.products, public.customers, public.suppliers,
                public.sales, public.sale_items, public.stock_movements, public.employee_messages TO anon;
GRANT SELECT (id, shop_id, name, phone, role, is_active, created_at) ON public.employees TO anon;
GRANT INSERT ON public.sales, public.sale_items, public.stock_movements, public.employee_messages TO anon;
GRANT UPDATE (stock, updated_at) ON public.products TO anon;

-- employees : plus d'INSERT direct (création via create_employee), mise à jour limitée
REVOKE INSERT, UPDATE ON public.employees FROM authenticated;
GRANT UPDATE (name, phone, role, is_active) ON public.employees TO authenticated;

-- Fonctions : fermées par défaut, puis ouvertes explicitement
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public._auto_classify_product_internal(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._generate_default_categories_internal(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._generate_pin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._admin_log(TEXT, TEXT, JSONB) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_auto_classify() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sales_set_employee() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.products_employee_guard() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_set_sender() FROM authenticated;

-- Utilisables par les employés (jeton) et les comptes connectés
GRANT EXECUTE ON FUNCTION public._norm_role(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_ctx() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_shop_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.employee_logout(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(UUID, NUMERIC) TO anon, authenticated;

-- Réservés aux comptes connectés
GRANT EXECUTE ON FUNCTION public.is_shop_manager(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_employee(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_employee_pin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_classify_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_classify_shop_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_default_categories(UUID) TO authenticated;
