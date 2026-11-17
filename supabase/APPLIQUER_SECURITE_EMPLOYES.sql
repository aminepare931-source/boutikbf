-- ============================================================================
-- Sécurité : connexion des employés limitée à UNE boutique
--
-- Avant : on se connectait avec « nom + PIN » sans dire quelle boutique. Un
-- attaquant pouvait essayer un PIN sur tous les employés portant le même prénom
-- dans TOUTES les boutiques (« Fatou », « Issa »…).
--
-- Maintenant :
--   * avec le code de la boutique (son « slug ») : on ne teste que cette boutique,
--     et les 5 essais permis par 15 minutes sont comptés par boutique ;
--   * sans code : accepté uniquement si le nom est UNIQUE sur toute la plateforme,
--     sinon la base répond « shop_required » et l'application demande le code.
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Peut être relancé sans risque.
-- ============================================================================

DROP FUNCTION IF EXISTS public.employee_login(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.employee_login(p_name TEXT, p_pin TEXT, p_shop TEXT DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  k   TEXT := lower(trim(coalesce(p_name, '')));
  s   TEXT := lower(trim(coalesce(p_shop, '')));
  lk  TEXT;
  r   RECORD;
  tok TEXT;
  fails INT;
  n   INT;
  exp TIMESTAMPTZ := now() + interval '12 hours';
BEGIN
  IF k = '' OR length(k) > 120 OR length(s) > 120
     OR p_pin IS NULL OR p_pin !~ '^[0-9]{4,8}$' THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_credentials');
  END IF;

  -- Clé de blocage : par boutique + nom (ou par nom seul sans code boutique)
  lk := CASE WHEN s = '' THEN k ELSE s || '/' || k END;

  SELECT count(*) INTO fails FROM public.employee_login_attempts
   WHERE login_key = lk AND NOT success AND attempted_at > now() - interval '15 minutes';
  IF fails >= 5 THEN
    RETURN json_build_object('ok', false, 'error', 'too_many_attempts');
  END IF;

  -- Sans code boutique, le nom doit être unique sur toute la plateforme
  IF s = '' THEN
    SELECT count(*) INTO n
      FROM public.employees e
      JOIN public.employee_credentials c ON c.employee_id = e.id
     WHERE lower(trim(e.name)) = k AND e.is_active;
    IF n > 1 THEN
      RETURN json_build_object('ok', false, 'error', 'shop_required');
    END IF;
  END IF;

  FOR r IN
    SELECT e.id, e.name, e.role, e.shop_id, c.pin_hash
      FROM public.employees e
      JOIN public.employee_credentials c ON c.employee_id = e.id
      JOIN public.shops sh ON sh.id = e.shop_id
     WHERE lower(trim(e.name)) = k AND e.is_active
       AND (s = '' OR lower(sh.slug) = s)
  LOOP
    IF r.pin_hash = extensions.crypt(p_pin, r.pin_hash) THEN
      tok := encode(extensions.gen_random_bytes(32), 'hex');
      INSERT INTO public.employee_sessions (token_hash, employee_id, shop_id, role, expires_at)
      VALUES (encode(extensions.digest(tok, 'sha256'), 'hex'), r.id, r.shop_id,
              public._norm_role(r.role), exp);
      DELETE FROM public.employee_login_attempts WHERE login_key = lk;
      DELETE FROM public.employee_sessions WHERE expires_at < now() - interval '1 day';
      RETURN json_build_object(
        'ok', true, 'token', tok, 'expires_at', exp,
        'employee', json_build_object('id', r.id, 'name', r.name,
                                      'role', public._norm_role(r.role), 'shop_id', r.shop_id));
    END IF;
  END LOOP;

  INSERT INTO public.employee_login_attempts (login_key, success) VALUES (lk, false);
  DELETE FROM public.employee_login_attempts WHERE attempted_at < now() - interval '1 day';
  RETURN json_build_object('ok', false, 'error', 'invalid_credentials');
END; $$;

REVOKE ALL ON FUNCTION public.employee_login(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employee_login(TEXT, TEXT, TEXT) TO anon, authenticated;
