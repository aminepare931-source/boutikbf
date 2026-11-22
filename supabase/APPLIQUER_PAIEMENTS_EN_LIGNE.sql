-- ============================================================================
-- Paiements en ligne des abonnements (agrégateur GeniusPay)
--
-- Principe de sécurité : AUCUNE de ces tables ni fonctions n'est accessible depuis
-- le navigateur. Seul le serveur (clé « service_role »), après avoir vérifié la
-- signature de GeniusPay ET relu le paiement chez GeniusPay, peut activer une formule.
-- Le montant est calculé ICI à partir de la formule : le client n'envoie jamais de prix.
--
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Peut être relancé sans risque.
-- ============================================================================

-- 1. Tables -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref            TEXT NOT NULL UNIQUE,           -- notre référence publique, non devinable
  shop_id        UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider       TEXT NOT NULL DEFAULT 'geniuspay',
  provider_ref   TEXT UNIQUE,                    -- référence GeniusPay (MTX-...)
  plan           TEXT NOT NULL CHECK (plan IN ('essentiel_paid', 'pro')),
  period         TEXT NOT NULL CHECK (period IN ('month', 'year')),
  amount         NUMERIC(14,2) NOT NULL CHECK (amount >= 200),
  currency       TEXT NOT NULL DEFAULT 'XOF',
  status         TEXT NOT NULL DEFAULT 'created'
                 CHECK (status IN ('created','pending','processing','paid','failed','cancelled','expired','refunded')),
  checkout_url   TEXT,
  fees           NUMERIC(14,2),
  net_amount     NUMERIC(14,2),
  environment    TEXT,
  method         TEXT,
  failure_reason TEXT,
  expires_at     TIMESTAMPTZ,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_intents_shop_idx ON public.payment_intents (shop_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id           BIGSERIAL PRIMARY KEY,
  provider     TEXT NOT NULL,
  event_id     TEXT,
  event        TEXT,
  provider_ref TEXT,
  environment  TEXT,
  outcome      TEXT,
  payload      JSONB,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_intents, public.payment_events FROM anon, authenticated;
GRANT ALL ON public.payment_intents, public.payment_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.payment_events_id_seq TO service_role;

-- 2. Prix : la seule source de vérité du montant -------------------------------
-- (doit rester identique à PRICES dans src/lib/plan-catalog.ts)
CREATE OR REPLACE FUNCTION public.plan_price(p_plan TEXT, p_period TEXT)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plan || '/' || p_period
    WHEN 'essentiel_paid/month' THEN 5000
    WHEN 'essentiel_paid/year'  THEN 50000
    WHEN 'pro/month'            THEN 10000
    WHEN 'pro/year'             THEN 100000
  END::NUMERIC
$$;

-- 3. Créer une intention de paiement ------------------------------------------
CREATE OR REPLACE FUNCTION public.payment_create_intent(
  p_user UUID, p_shop UUID, p_plan TEXT, p_period TEXT
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_price NUMERIC := public.plan_price(p_plan, p_period);
  v_cur_plan TEXT; v_susp BOOLEAN;
  v_existing public.payment_intents%ROWTYPE;
  v_new public.payment_intents%ROWTYPE;
BEGIN
  IF v_price IS NULL THEN RAISE EXCEPTION 'Formule ou période inconnue'; END IF;
  IF p_user IS NULL THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  -- Seul le propriétaire (ou un administrateur de la boutique) peut payer
  IF NOT EXISTS (SELECT 1 FROM public.shops s WHERE s.id = p_shop AND s.owner_id = p_user)
     AND NOT EXISTS (SELECT 1 FROM public.shop_members m
                      WHERE m.shop_id = p_shop AND m.user_id = p_user AND m.role = 'admin') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT plan, is_suspended INTO v_cur_plan, v_susp FROM public.shops WHERE id = p_shop;
  IF v_susp THEN RAISE EXCEPTION 'Boutique suspendue : contactez BoutikBF'; END IF;
  IF v_cur_plan = 'sur-mesure' THEN RAISE EXCEPTION 'Formule sur mesure : contactez BoutikBF'; END IF;
  IF v_cur_plan = 'pro' AND p_plan = 'essentiel_paid' THEN
    RAISE EXCEPTION 'Cette boutique a déjà la formule Pro';
  END IF;

  -- Double clic : on réutilise le paiement en cours (moins de 30 minutes)
  SELECT * INTO v_existing FROM public.payment_intents
   WHERE shop_id = p_shop AND plan = p_plan AND period = p_period
     AND status IN ('created', 'pending') AND checkout_url IS NOT NULL
     AND created_at > now() - interval '30 minutes'
     AND (expires_at IS NULL OR expires_at > now())
   ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN json_build_object('id', v_existing.id, 'ref', v_existing.ref, 'amount', v_existing.amount,
      'currency', v_existing.currency, 'plan', v_existing.plan, 'period', v_existing.period,
      'checkout_url', v_existing.checkout_url, 'reused', true);
  END IF;

  -- Garde-fou contre les abus : 10 créations par heure et par boutique
  IF (SELECT count(*) FROM public.payment_intents
       WHERE shop_id = p_shop AND created_at > now() - interval '1 hour') >= 10 THEN
    RAISE EXCEPTION 'Trop de tentatives de paiement : réessayez dans une heure';
  END IF;

  INSERT INTO public.payment_intents (ref, shop_id, created_by, plan, period, amount)
  VALUES ('BF-' || upper(encode(extensions.gen_random_bytes(12), 'hex')),
          p_shop, p_user, p_plan, p_period, v_price)
  RETURNING * INTO v_new;

  RETURN json_build_object('id', v_new.id, 'ref', v_new.ref, 'amount', v_new.amount,
    'currency', v_new.currency, 'plan', v_new.plan, 'period', v_new.period, 'reused', false);
END; $$;

-- 4. Rattacher la référence de l'agrégateur -----------------------------------
CREATE OR REPLACE FUNCTION public.payment_attach_provider(
  p_intent UUID, p_provider_ref TEXT, p_checkout_url TEXT, p_expires TIMESTAMPTZ,
  p_fees NUMERIC, p_env TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.payment_intents
     SET provider_ref = p_provider_ref, checkout_url = p_checkout_url, expires_at = p_expires,
         fees = p_fees, environment = p_env, status = 'pending', updated_at = now()
   WHERE id = p_intent AND status = 'created';
END; $$;

CREATE OR REPLACE FUNCTION public.payment_fail_creation(p_intent UUID, p_reason TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.payment_intents
     SET status = 'failed', failure_reason = left(coalesce(p_reason, 'creation_failed'), 200), updated_at = now()
   WHERE id = p_intent AND status = 'created';
$$;

-- 5. Lire une intention (côté serveur) ----------------------------------------
CREATE OR REPLACE FUNCTION public.payment_get_by_ref(p_ref TEXT)
RETURNS JSON LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_to_json(t) FROM (
    SELECT i.id, i.ref, i.provider_ref, i.status, i.amount, i.currency, i.plan, i.period,
           i.shop_id, i.expires_at, i.paid_at, i.failure_reason, i.environment
      FROM public.payment_intents i
     WHERE i.ref = p_ref OR i.provider_ref = p_ref
     LIMIT 1
  ) t
$$;

-- 6. Appliquer un résultat de paiement (idempotent) ----------------------------
-- Appelée uniquement après vérification de la signature ET relecture chez l'agrégateur.
CREATE OR REPLACE FUNCTION public.payment_apply(
  p_ref TEXT, p_status TEXT, p_amount NUMERIC, p_fees NUMERIC, p_net NUMERIC,
  p_env TEXT, p_method TEXT, p_reason TEXT DEFAULT NULL, p_allow_sandbox BOOLEAN DEFAULT FALSE
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  i public.payment_intents%ROWTYPE;
  v_start DATE; v_end DATE; v_method TEXT; v_prev_end DATE;
BEGIN
  IF p_status NOT IN ('pending','processing','paid','failed','cancelled','expired','refunded') THEN
    RETURN json_build_object('ok', false, 'error', 'bad_status');
  END IF;

  SELECT * INTO i FROM public.payment_intents
   WHERE ref = p_ref OR provider_ref = p_ref FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('ok', false, 'error', 'not_found'); END IF;

  -- Déjà payé : on ne refait jamais l'activation (ni sur un rappel en double)
  IF i.status = 'paid' AND p_status = 'paid' THEN
    RETURN json_build_object('ok', true, 'already', true, 'status', 'paid', 'shop_id', i.shop_id);
  END IF;

  IF p_status = 'paid' THEN
    IF p_amount IS DISTINCT FROM i.amount THEN
      UPDATE public.payment_intents
         SET failure_reason = 'amount_mismatch', updated_at = now() WHERE id = i.id;
      RETURN json_build_object('ok', false, 'error', 'amount_mismatch', 'status', i.status);
    END IF;

    -- Les paiements d'essai (sandbox) n'activent jamais une vraie formule
    IF coalesce(p_env, 'live') <> 'live' AND NOT p_allow_sandbox THEN
      UPDATE public.payment_intents
         SET environment = p_env, failure_reason = 'sandbox_not_activated', updated_at = now()
       WHERE id = i.id;
      RETURN json_build_object('ok', true, 'activated', false, 'sandbox', true, 'status', i.status);
    END IF;

    v_method := CASE
      WHEN lower(coalesce(p_method, '')) LIKE '%orange%' THEN 'orange_money'
      WHEN lower(coalesce(p_method, '')) LIKE '%moov%'   THEN 'moov_money'
      WHEN lower(coalesce(p_method, '')) LIKE '%wave%'   THEN 'wave'
      ELSE 'other' END;

    -- Renouvellement : la nouvelle période commence à la fin de la précédente si elle court encore
    SELECT max(period_end) INTO v_prev_end FROM public.shop_payments
     WHERE shop_id = i.shop_id AND plan = i.plan;
    v_start := greatest(current_date, coalesce(v_prev_end, current_date));
    v_end := (v_start + CASE i.period WHEN 'year' THEN interval '1 year' ELSE interval '1 month' END)::date;

    UPDATE public.shops SET plan = i.plan, trial_ends_at = NULL, updated_at = now()
     WHERE id = i.shop_id;

    INSERT INTO public.shop_payments (shop_id, amount, method, plan, period_start, period_end, paid_at, note, created_by)
    VALUES (i.shop_id, i.amount, v_method, i.plan, v_start, v_end, now(),
            'Paiement en ligne ' || i.provider || ' ' || coalesce(i.provider_ref, i.ref), i.created_by);

    UPDATE public.payment_intents
       SET status = 'paid', paid_at = now(), fees = coalesce(p_fees, fees), net_amount = p_net,
           environment = p_env, method = v_method, failure_reason = NULL, updated_at = now()
     WHERE id = i.id;

    RETURN json_build_object('ok', true, 'activated', true, 'status', 'paid', 'shop_id', i.shop_id,
                             'plan', i.plan, 'period_end', v_end);
  END IF;

  IF p_status = 'refunded' THEN
    IF i.status = 'paid' THEN
      UPDATE public.payment_intents SET status = 'refunded', updated_at = now() WHERE id = i.id;
    END IF;
    RETURN json_build_object('ok', true, 'status', 'refunded', 'shop_id', i.shop_id, 'needs_review', true);
  END IF;

  -- Échec, annulation, expiration, en cours : on ne rétrograde jamais un paiement déjà réussi
  IF i.status NOT IN ('paid', 'refunded') THEN
    UPDATE public.payment_intents
       SET status = p_status, failure_reason = coalesce(left(p_reason, 200), failure_reason),
           updated_at = now()
     WHERE id = i.id;
  END IF;
  RETURN json_build_object('ok', true, 'status', CASE WHEN i.status IN ('paid','refunded') THEN i.status ELSE p_status END,
                           'shop_id', i.shop_id);
END; $$;

-- 7. Journal des notifications reçues ------------------------------------------
CREATE OR REPLACE FUNCTION public.payment_log_event(
  p_provider TEXT, p_event_id TEXT, p_event TEXT, p_ref TEXT, p_env TEXT, p_outcome TEXT, p_payload JSONB
) RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.payment_events (provider, event_id, event, provider_ref, environment, outcome, payload)
  VALUES (p_provider, p_event_id, p_event, p_ref, p_env, p_outcome, p_payload);
$$;

-- 8. Super admin : liste des paiements en ligne ---------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_payment_intents(p_limit INT DEFAULT 50)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN (SELECT coalesce(json_agg(t), '[]'::json) FROM (
    SELECT i.id, i.ref, i.provider_ref, i.status, i.amount, i.fees, i.net_amount, i.plan, i.period,
           i.method, i.environment, i.failure_reason, i.created_at, i.paid_at, s.name AS shop_name, s.id AS shop_id
      FROM public.payment_intents i JOIN public.shops s ON s.id = i.shop_id
     ORDER BY i.created_at DESC LIMIT greatest(1, least(coalesce(p_limit, 50), 200))
  ) t);
END; $$;

-- 9. Droits : le serveur seul (service_role) ; jamais le navigateur ------------
REVOKE EXECUTE ON FUNCTION public.payment_create_intent(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payment_attach_provider(UUID, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payment_fail_creation(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payment_get_by_ref(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payment_apply(TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payment_log_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.payment_create_intent(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_attach_provider(UUID, TEXT, TEXT, TIMESTAMPTZ, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_fail_creation(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_get_by_ref(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_apply(TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.payment_log_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
REVOKE EXECUTE ON FUNCTION public.admin_list_payment_intents(INT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_payment_intents(INT) TO authenticated;
