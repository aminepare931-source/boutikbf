-- ============================================================================
-- Fiche boutique (super admin) : toutes les infos + performances d'une boutique
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Lecture seule.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_shop_details(p_shop_id UUID, p_days INT DEFAULT 30)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  d         INT  := greatest(7, least(coalesce(p_days, 30), 180));
  start_day DATE := (now()::date - (d - 1));
  prev_day  DATE := (now()::date - (2 * d - 1));
  r         JSON;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id) THEN
    RAISE EXCEPTION 'Boutique introuvable';
  END IF;

  WITH
  -- 1. Caractéristiques de la boutique ---------------------------------------
  shop AS (
    SELECT json_build_object(
      'id',            s.id,
      'name',          s.name,
      'slug',          s.slug,
      'logo_url',      s.logo_url,
      'currency',      s.currency,
      'country',       s.country,
      'address',       s.address,
      'phone',         s.phone,
      'email',         s.email,
      'plan',          s.plan,
      'created_at',    s.created_at,
      'trial_ends_at', s.trial_ends_at,
      'trial_end',     coalesce(s.trial_ends_at, s.created_at + interval '15 days'),
      'is_suspended',  s.is_suspended,
      'admin_notes',   n.notes
    ) AS j
    FROM public.shops s
    LEFT JOIN public.shop_admin_notes n ON n.shop_id = s.id
    WHERE s.id = p_shop_id
  ),
  -- 2. Propriétaire -----------------------------------------------------------
  owner AS (
    SELECT json_build_object(
      'email',            u.email::TEXT,
      'full_name',        p.full_name,
      'phone',            p.phone,
      'created_at',       u.created_at,
      'last_sign_in_at',  u.last_sign_in_at,
      'banned_until',     u.banned_until
    ) AS j
    FROM public.shops s
    LEFT JOIN auth.users u  ON u.id = s.owner_id
    LEFT JOIN public.profiles p ON p.id = s.owner_id
    WHERE s.id = p_shop_id
  ),
  -- 3. Ventes de la boutique (terminées uniquement pour les volumes) ---------
  sales_all AS (
    SELECT count(*)                              AS n_all,
           coalesce(sum(total), 0)               AS v_all,
           count(*) FILTER (WHERE status <> 'completed') AS n_cancelled,
           max(created_at)                       AS last_sale
      FROM public.sales WHERE shop_id = p_shop_id
  ),
  sales_p AS (
    SELECT count(*)                AS n,
           coalesce(sum(total), 0) AS v
      FROM public.sales
     WHERE shop_id = p_shop_id AND status = 'completed' AND created_at >= start_day
  ),
  sales_prev AS (
    SELECT count(*)                AS n,
           coalesce(sum(total), 0) AS v
      FROM public.sales
     WHERE shop_id = p_shop_id AND status = 'completed'
       AND created_at >= prev_day AND created_at < start_day
  ),
  -- série quotidienne de la période
  series AS (
    SELECT coalesce(json_agg(json_build_object(
             'day',    to_char(days.day, 'YYYY-MM-DD'),
             'sales',  coalesce(sa.n, 0),
             'volume', coalesce(sa.v, 0)
           ) ORDER BY days.day), '[]'::json) AS j
      FROM (SELECT g::date AS day FROM generate_series(start_day, now()::date, interval '1 day') g) days
      LEFT JOIN (
        SELECT created_at::date AS day, count(*) AS n, coalesce(sum(total), 0) AS v
          FROM public.sales
         WHERE shop_id = p_shop_id AND status = 'completed' AND created_at >= start_day
         GROUP BY 1
      ) sa ON sa.day = days.day
  ),
  -- 4. Répartition par mode de paiement (période) -----------------------------
  payments AS (
    SELECT coalesce(json_agg(t ORDER BY t.volume DESC), '[]'::json) AS j FROM (
      SELECT payment_method AS method, count(*) AS n, coalesce(sum(total), 0) AS volume
        FROM public.sales
       WHERE shop_id = p_shop_id AND status = 'completed' AND created_at >= start_day
       GROUP BY 1
    ) t
  ),
  -- 5. Meilleurs produits (toutes périodes, par revenu) -----------------------
  top_products AS (
    SELECT coalesce(json_agg(t ORDER BY t.revenue DESC), '[]'::json) AS j FROM (
      SELECT coalesce(si.name, 'Produit supprimé') AS name,
             sum(si.quantity)  AS qty,
             sum(si.total)     AS revenue
        FROM public.sale_items si
        JOIN public.sales s ON s.id = si.sale_id
       WHERE s.shop_id = p_shop_id AND s.status = 'completed'
       GROUP BY 1
       ORDER BY sum(si.total) DESC
       LIMIT 10
    ) t
  ),
  -- 6. Meilleurs clients (période) --------------------------------------------
  top_customers AS (
    SELECT coalesce(json_agg(t ORDER BY t.volume DESC), '[]'::json) AS j FROM (
      SELECT c.name, count(*) AS n, coalesce(sum(s.total), 0) AS volume
        FROM public.sales s
        JOIN public.customers c ON c.id = s.customer_id
       WHERE s.shop_id = p_shop_id AND s.status = 'completed' AND s.created_at >= start_day
       GROUP BY c.name
       ORDER BY sum(s.total) DESC
       LIMIT 5
    ) t
  ),
  -- 7. Catalogue & stock -------------------------------------------------------
  catalog AS (
    SELECT json_build_object(
      'categories',    (SELECT count(*) FROM public.categories WHERE shop_id = p_shop_id),
      'products',      count(*),
      'active',        count(*) FILTER (WHERE is_active),
      'inactive',      count(*) FILTER (WHERE NOT is_active),
      'with_barcode',  count(*) FILTER (WHERE barcode IS NOT NULL AND barcode <> ''),
      'stock_units',   coalesce(sum(stock) FILTER (WHERE is_active), 0),
      'stock_value',   coalesce(sum(stock * cost_price) FILTER (WHERE is_active), 0),
      'out_of_stock',  count(*) FILTER (WHERE is_active AND stock <= 0),
      'low_stock',     count(*) FILTER (WHERE is_active AND stock_min > 0 AND stock <= stock_min AND stock > 0)
    ) AS j
    FROM public.products WHERE shop_id = p_shop_id
  ),
  stock_alerts AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT name, stock, unit, stock_min,
             CASE WHEN stock <= 0 THEN 'rupture' ELSE 'bas' END AS state
        FROM public.products
       WHERE shop_id = p_shop_id AND is_active
         AND (stock <= 0 OR (stock_min > 0 AND stock <= stock_min))
       ORDER BY stock ASC
       LIMIT 12
    ) t
  ),
  -- 8. Clients, membres, employés ---------------------------------------------
  cust AS (
    SELECT json_build_object(
      'count',        (SELECT count(*) FROM public.customers WHERE shop_id = p_shop_id),
      'with_credit',  (SELECT count(*) FROM public.customers WHERE shop_id = p_shop_id AND credit_balance > 0),
      'credit_total', (SELECT coalesce(sum(credit_balance), 0) FROM public.customers WHERE shop_id = p_shop_id)
    ) AS j
  ),
  members AS (
    SELECT coalesce(json_agg(t ORDER BY t.created_at), '[]'::json) AS j FROM (
      SELECT coalesce(p.full_name, u.email::TEXT) AS name, m.role::TEXT AS role, m.created_at
        FROM public.shop_members m
        LEFT JOIN auth.users u   ON u.id = m.user_id
        LEFT JOIN public.profiles p ON p.id = m.user_id
       WHERE m.shop_id = p_shop_id
    ) t
  ),
  employees AS (
    SELECT coalesce(json_agg(t ORDER BY t.created_at), '[]'::json) AS j FROM (
      SELECT name, role, is_active, created_at
        FROM public.employees WHERE shop_id = p_shop_id
    ) t
  ),
  -- 9. Dernières ventes ---------------------------------------------------------
  recent_sales AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT s.id, s.created_at, s.total, s.payment_method, s.status,
             c.name AS customer
        FROM public.sales s
        LEFT JOIN public.customers c ON c.id = s.customer_id
       WHERE s.shop_id = p_shop_id
       ORDER BY s.created_at DESC
       LIMIT 12
    ) t
  ),
  -- 10. Journal admin concernant cette boutique ---------------------------------
  audit AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT a.action, a.created_at, a.details, coalesce(p.full_name, u.email::TEXT) AS admin
        FROM public.admin_audit_log a
        LEFT JOIN auth.users u     ON u.id = a.admin_id
        LEFT JOIN public.profiles p ON p.id = a.admin_id
       WHERE a.target = p_shop_id::TEXT
       ORDER BY a.created_at DESC
       LIMIT 10
    ) t
  )
  SELECT json_build_object(
    'days',         d,
    'shop',         (SELECT j FROM shop),
    'owner',        (SELECT j FROM owner),
    'sales',        json_build_object(
                      'n_all',       (SELECT n_all FROM sales_all),
                      'v_all',       (SELECT v_all FROM sales_all),
                      'n_cancelled', (SELECT n_cancelled FROM sales_all),
                      'last_sale',   (SELECT last_sale FROM sales_all),
                      'n_p',         (SELECT n FROM sales_p),
                      'v_p',         (SELECT v FROM sales_p),
                      'n_prev',      (SELECT n FROM sales_prev),
                      'v_prev',      (SELECT v FROM sales_prev),
                      'avg_basket_p',(SELECT round((SELECT v FROM sales_p) / nullif((SELECT n FROM sales_p), 0)) ),
                      'avg_basket_all', (SELECT round((SELECT v_all FROM sales_all) / nullif((SELECT n_all FROM sales_all), 0)))
                    ),
    'series',       (SELECT j FROM series),
    'payments',     (SELECT j FROM payments),
    'top_products', (SELECT j FROM top_products),
    'top_customers',(SELECT j FROM top_customers),
    'catalog',      (SELECT j FROM catalog),
    'stock_alerts', (SELECT j FROM stock_alerts),
    'customers',    (SELECT j FROM cust),
    'members',      (SELECT j FROM members),
    'employees',    (SELECT j FROM employees),
    'recent_sales', (SELECT j FROM recent_sales),
    'audit',        (SELECT j FROM audit)
  ) INTO r;

  RETURN r;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_shop_details(uuid, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_shop_details(uuid, int) TO authenticated;
