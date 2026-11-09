-- ============================================================================
-- Tableau de bord super admin : performance du SaaS
-- À exécuter UNE FOIS dans Supabase > SQL Editor (après le SQL super admin).
-- Lecture seule : cette fonction ne modifie aucune donnée.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_dashboard(p_days INT DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  d         INT  := greatest(7, least(coalesce(p_days, 30), 180));
  start_day DATE := (now()::date - (d - 1));
  prev_day  DATE := (now()::date - (2 * d - 1));
  r         JSON;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  WITH
  -- une ligne par jour de la période
  days AS (
    SELECT g::date AS day FROM generate_series(start_day, now()::date, interval '1 day') g
  ),
  s_users AS (
    SELECT created_at::date AS day, count(*) AS n
      FROM auth.users WHERE created_at >= start_day GROUP BY 1
  ),
  s_shops AS (
    SELECT created_at::date AS day, count(*) AS n
      FROM public.shops WHERE created_at >= start_day GROUP BY 1
  ),
  s_sales AS (
    SELECT created_at::date AS day, count(*) AS n, coalesce(sum(total), 0) AS v
      FROM public.sales WHERE status = 'completed' AND created_at >= start_day GROUP BY 1
  ),
  series AS (
    SELECT json_agg(json_build_object(
             'day',    to_char(days.day, 'YYYY-MM-DD'),
             'users',  coalesce(u.n, 0),
             'shops',  coalesce(sh.n, 0),
             'sales',  coalesce(sa.n, 0),
             'volume', coalesce(sa.v, 0)
           ) ORDER BY days.day) AS j
      FROM days
      LEFT JOIN s_users u  ON u.day  = days.day
      LEFT JOIN s_shops sh ON sh.day = days.day
      LEFT JOIN s_sales sa ON sa.day = days.day
  ),
  -- statistiques par boutique (ventes terminées uniquement)
  sale_agg AS (
    SELECT shop_id,
           count(*)                                                       AS sales_all,
           count(*)  FILTER (WHERE created_at >= start_day)               AS sales_p,
           coalesce(sum(total) FILTER (WHERE created_at >= start_day), 0) AS volume_p,
           max(created_at)                                                AS last_sale
      FROM public.sales WHERE status = 'completed' GROUP BY shop_id
  ),
  shop_stats AS (
    SELECT s.id, s.name, s.plan, s.phone, s.created_at, s.is_suspended,
           coalesce(s.trial_ends_at, s.created_at + interval '15 days') AS trial_end,
           u.email::TEXT AS owner_email,
           coalesce(a.sales_all, 0) AS sales_all,
           coalesce(a.sales_p, 0)   AS sales_p,
           coalesce(a.volume_p, 0)  AS volume_p,
           a.last_sale
      FROM public.shops s
      LEFT JOIN sale_agg a   ON a.shop_id = s.id
      LEFT JOIN auth.users u ON u.id = s.owner_id
  ),
  totals AS (
    SELECT json_build_object(
      'shops',        (SELECT count(*) FROM public.shops),
      'users',        (SELECT count(*) FROM auth.users),
      'products',     (SELECT count(*) FROM public.products),
      'sales_all',    (SELECT coalesce(sum(sales_all), 0) FROM shop_stats),
      'volume_all',   (SELECT coalesce(sum(total), 0) FROM public.sales WHERE status = 'completed'),
      'shops_p',      (SELECT count(*) FROM public.shops WHERE created_at >= start_day),
      'shops_prev',   (SELECT count(*) FROM public.shops WHERE created_at >= prev_day AND created_at < start_day),
      'users_p',      (SELECT count(*) FROM auth.users WHERE created_at >= start_day),
      'users_prev',   (SELECT count(*) FROM auth.users WHERE created_at >= prev_day AND created_at < start_day),
      'sales_p',      (SELECT coalesce(sum(sales_p), 0) FROM shop_stats),
      'sales_prev',   (SELECT count(*) FROM public.sales WHERE status = 'completed'
                         AND created_at >= prev_day AND created_at < start_day),
      'volume_p',     (SELECT coalesce(sum(volume_p), 0) FROM shop_stats),
      'volume_prev',  (SELECT coalesce(sum(total), 0) FROM public.sales WHERE status = 'completed'
                         AND created_at >= prev_day AND created_at < start_day),
      'shops_before', (SELECT count(*) FROM public.shops WHERE created_at < start_day),
      'users_before', (SELECT count(*) FROM auth.users WHERE created_at < start_day)
    ) AS j
  ),
  plans AS (
    SELECT json_build_object(
      'essentiel',      count(*) FILTER (WHERE plan = 'essentiel'),
      'essentiel_paid', count(*) FILTER (WHERE plan = 'essentiel_paid'),
      'pro',            count(*) FILTER (WHERE plan = 'pro'),
      'sur_mesure',     count(*) FILTER (WHERE plan = 'sur-mesure'),
      'trials_active',  count(*) FILTER (WHERE plan = 'essentiel' AND trial_end >= now()),
      'trials_ending_7d', count(*) FILTER (WHERE plan = 'essentiel'
                                           AND trial_end BETWEEN now() AND now() + interval '7 days'),
      'trials_expired', count(*) FILTER (WHERE plan = 'essentiel' AND trial_end < now()),
      'suspended',      count(*) FILTER (WHERE is_suspended)
    ) AS j
    FROM shop_stats
  ),
  activity AS (
    SELECT json_build_object(
      'active_7d',  count(*) FILTER (WHERE last_sale >= now() - interval '7 days'),
      'active_30d', count(*) FILTER (WHERE last_sale >= now() - interval '30 days'),
      'dormant',    count(*) FILTER (WHERE NOT is_suspended
                                       AND created_at < now() - interval '14 days'
                                       AND (last_sale IS NULL OR last_sale < now() - interval '14 days')),
      'never_sold', count(*) FILTER (WHERE sales_all = 0)
    ) AS j
    FROM shop_stats
  ),
  -- passages d'un essai vers un plan payant (enregistrés par le super admin)
  conv AS (
    SELECT json_build_object(
      'now',  count(*) FILTER (WHERE created_at >= start_day),
      'prev', count(*) FILTER (WHERE created_at >= prev_day AND created_at < start_day)
    ) AS j
    FROM public.admin_audit_log
    WHERE action = 'set_plan'
      AND details->>'from' = 'essentiel'
      AND details->>'to' IN ('essentiel_paid', 'pro', 'sur-mesure')
      AND created_at >= prev_day
  ),
  top_shops AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT id, name, plan, sales_p, volume_p, sales_all, last_sale
        FROM shop_stats WHERE volume_p > 0
       ORDER BY volume_p DESC LIMIT 10
    ) t
  ),
  -- clients payants qui ne vendent plus : risque de départ
  at_risk AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT id, name, plan, phone, owner_email, last_sale, sales_all
        FROM shop_stats
       WHERE plan IN ('essentiel_paid', 'pro', 'sur-mesure') AND NOT is_suspended
         AND (last_sale IS NULL OR last_sale < now() - interval '14 days')
       ORDER BY last_sale ASC NULLS FIRST LIMIT 10
    ) t
  ),
  -- essais les plus actifs : les meilleurs prospects à convertir
  hot_trials AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT id, name, phone, owner_email, trial_end, sales_all, sales_p, volume_p, last_sale
        FROM shop_stats
       WHERE plan = 'essentiel' AND NOT is_suspended AND sales_all > 0
       ORDER BY (trial_end < now()) DESC, sales_p DESC, sales_all DESC LIMIT 10
    ) t
  )
  SELECT json_build_object(
    'days',        d,
    'series',      (SELECT coalesce(j, '[]'::json) FROM series),
    'totals',      (SELECT j FROM totals),
    'plans',       (SELECT j FROM plans),
    'activity',    (SELECT j FROM activity),
    'conversions', (SELECT j FROM conv),
    'top_shops',   (SELECT j FROM top_shops),
    'at_risk',     (SELECT j FROM at_risk),
    'hot_trials',  (SELECT j FROM hot_trials)
  ) INTO r;

  RETURN r;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_dashboard(int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_dashboard(int) TO authenticated;
