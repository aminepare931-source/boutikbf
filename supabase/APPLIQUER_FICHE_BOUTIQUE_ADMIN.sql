-- ============================================================================
-- Fiche complète d'une boutique pour le super admin
-- À exécuter UNE FOIS dans Supabase > SQL Editor. Lecture seule.
-- Les codes PIN des employés ne sont jamais renvoyés.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_shop_detail(p_shop_id UUID)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE r JSON;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id) THEN
    RAISE EXCEPTION 'Boutique introuvable';
  END IF;

  WITH
  done AS (
    SELECT * FROM public.sales WHERE shop_id = p_shop_id AND status = 'completed'
  ),
  money AS (
    SELECT json_build_object(
      'sales_all',     count(*),
      'volume_all',    coalesce(sum(total), 0),
      'sales_today',   count(*) FILTER (WHERE created_at >= date_trunc('day', now())),
      'volume_today',  coalesce(sum(total) FILTER (WHERE created_at >= date_trunc('day', now())), 0),
      'sales_7d',      count(*) FILTER (WHERE created_at >= now() - interval '7 days'),
      'volume_7d',     coalesce(sum(total) FILTER (WHERE created_at >= now() - interval '7 days'), 0),
      'sales_30d',     count(*) FILTER (WHERE created_at >= now() - interval '30 days'),
      'volume_30d',    coalesce(sum(total) FILTER (WHERE created_at >= now() - interval '30 days'), 0),
      'avg_basket_30d', coalesce(avg(total) FILTER (WHERE created_at >= now() - interval '30 days'), 0),
      'discount_all',  coalesce(sum(discount), 0),
      'tax_all',       coalesce(sum(tax), 0),
      'first_sale',    min(created_at),
      'last_sale',     max(created_at),
      'cancelled',     (SELECT count(*) FROM public.sales
                          WHERE shop_id = p_shop_id AND status <> 'completed')
    ) AS j FROM done
  ),
  margin AS (
    SELECT json_build_object(
      'margin_all', coalesce(sum(si.total - si.quantity * p.cost_price) FILTER (WHERE p.cost_price > 0), 0),
      'margin_30d', coalesce(sum(si.total - si.quantity * p.cost_price)
                       FILTER (WHERE p.cost_price > 0 AND d.created_at >= now() - interval '30 days'), 0)
    ) AS j
    FROM public.sale_items si
    JOIN done d ON d.id = si.sale_id
    JOIN public.products p ON p.id = si.product_id
  ),
  stock AS (
    SELECT json_build_object(
      'products_total',     count(*),
      'products_active',    count(*) FILTER (WHERE is_active),
      'out_of_stock',       count(*) FILTER (WHERE is_active AND stock <= 0),
      'low_stock',          count(*) FILTER (WHERE is_active AND stock > 0 AND stock <= stock_min),
      'stock_cost_value',   coalesce(sum(stock * cost_price)   FILTER (WHERE stock > 0), 0),
      'stock_retail_value', coalesce(sum(stock * sale_price)   FILTER (WHERE stock > 0), 0)
    ) AS j FROM public.products WHERE shop_id = p_shop_id
  ),
  counts AS (
    SELECT json_build_object(
      'categories',       (SELECT count(*) FROM public.categories WHERE shop_id = p_shop_id),
      'customers',        (SELECT count(*) FROM public.customers WHERE shop_id = p_shop_id),
      'customers_credit', (SELECT coalesce(sum(credit_balance), 0) FROM public.customers WHERE shop_id = p_shop_id),
      'loyalty_points',   (SELECT coalesce(sum(loyalty_points), 0) FROM public.customers WHERE shop_id = p_shop_id),
      'suppliers',        (SELECT count(*) FROM public.suppliers WHERE shop_id = p_shop_id),
      'suppliers_balance',(SELECT coalesce(sum(balance), 0) FROM public.suppliers WHERE shop_id = p_shop_id),
      'members',          (SELECT count(*) FROM public.shop_members WHERE shop_id = p_shop_id),
      'employees',        (SELECT count(*) FROM public.employees WHERE shop_id = p_shop_id),
      'employees_active', (SELECT count(*) FROM public.employees WHERE shop_id = p_shop_id AND is_active),
      'movements',        (SELECT count(*) FROM public.stock_movements WHERE shop_id = p_shop_id),
      'messages',         (SELECT count(*) FROM public.employee_messages WHERE shop_id = p_shop_id),
      'imports',          (SELECT count(*) FROM public.imported_data WHERE shop_id = p_shop_id)
    ) AS j
  ),
  series AS (
    SELECT coalesce(json_agg(json_build_object(
             'day',    to_char(g.day, 'YYYY-MM-DD'),
             'sales',  coalesce(x.n, 0),
             'volume', coalesce(x.v, 0)) ORDER BY g.day), '[]'::json) AS j
    FROM (SELECT gs::date AS day FROM generate_series(now()::date - 29, now()::date, interval '1 day') gs) g
    LEFT JOIN (SELECT created_at::date AS day, count(*) AS n, sum(total) AS v
                 FROM done WHERE created_at >= now()::date - 29 GROUP BY 1) x ON x.day = g.day
  ),
  by_payment AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT payment_method AS method, count(*) AS sales, coalesce(sum(total), 0) AS volume
        FROM done GROUP BY 1 ORDER BY 3 DESC
    ) t
  ),
  top_products AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT si.name, sum(si.quantity) AS qty, sum(si.total) AS revenue
        FROM public.sale_items si JOIN done d ON d.id = si.sale_id
       WHERE d.created_at >= now() - interval '30 days'
       GROUP BY si.name ORDER BY revenue DESC LIMIT 10
    ) t
  ),
  by_seller AS (
    SELECT coalesce(json_agg(t), '[]'::json) AS j FROM (
      SELECT coalesce(e.name, 'Compte propriétaire / membre') AS name,
             count(*) AS sales, coalesce(sum(d.total), 0) AS volume
        FROM done d LEFT JOIN public.employees e ON e.id = d.employee_id
       GROUP BY 1 ORDER BY 3 DESC LIMIT 15
    ) t
  )
  SELECT json_build_object(
    'shop', (SELECT row_to_json(s) FROM public.shops s WHERE s.id = p_shop_id),
    'owner', (SELECT json_build_object(
                'id', u.id, 'email', u.email, 'full_name', p.full_name, 'phone', p.phone,
                'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
                'banned_until', u.banned_until)
              FROM public.shops s
              LEFT JOIN auth.users u ON u.id = s.owner_id
              LEFT JOIN public.profiles p ON p.id = s.owner_id
              WHERE s.id = p_shop_id),
    'notes',        (SELECT notes FROM public.shop_admin_notes WHERE shop_id = p_shop_id),
    'money',        (SELECT j FROM money),
    'margin',       (SELECT j FROM margin),
    'stock',        (SELECT j FROM stock),
    'counts',       (SELECT j FROM counts),
    'series',       (SELECT j FROM series),
    'by_payment',   (SELECT j FROM by_payment),
    'top_products', (SELECT j FROM top_products),
    'by_seller',    (SELECT j FROM by_seller),

    'members', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT m.id, m.user_id, m.role::text AS role, m.created_at,
               u.email::text AS email, p.full_name, u.last_sign_in_at
          FROM public.shop_members m
          LEFT JOIN auth.users u ON u.id = m.user_id
          LEFT JOIN public.profiles p ON p.id = m.user_id
         WHERE m.shop_id = p_shop_id ORDER BY m.created_at
      ) t),

    -- jamais de PIN
    'employees', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT e.id, e.name, e.phone, e.role, e.is_active, e.created_at,
               (SELECT count(*) FROM done d WHERE d.employee_id = e.id) AS sales,
               (SELECT coalesce(sum(d.total), 0) FROM done d WHERE d.employee_id = e.id) AS volume
          FROM public.employees e WHERE e.shop_id = p_shop_id ORDER BY e.created_at
      ) t),

    'categories', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT c.id, c.name, c.description, c.is_auto_generated, c.created_at,
               (SELECT count(*) FROM public.products pr WHERE pr.category_id = c.id) AS products
          FROM public.categories c WHERE c.shop_id = p_shop_id ORDER BY c.name LIMIT 300
      ) t),

    'products', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT pr.id, pr.name, pr.sku, pr.barcode, pr.brand, c.name AS category,
               pr.cost_price, pr.sale_price, pr.promo_price, pr.stock, pr.stock_min,
               pr.unit, pr.is_active, pr.created_at
          FROM public.products pr LEFT JOIN public.categories c ON c.id = pr.category_id
         WHERE pr.shop_id = p_shop_id ORDER BY pr.name LIMIT 500
      ) t),

    'customers', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT cu.id, cu.name, cu.phone, cu.email, cu.address, cu.loyalty_points,
               cu.credit_balance, cu.notes, cu.created_at,
               (SELECT count(*) FROM done d WHERE d.customer_id = cu.id) AS purchases,
               (SELECT coalesce(sum(d.total), 0) FROM done d WHERE d.customer_id = cu.id) AS spent
          FROM public.customers cu WHERE cu.shop_id = p_shop_id ORDER BY cu.created_at DESC LIMIT 500
      ) t),

    'suppliers', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT id, name, phone, email, address, balance, notes, created_at
          FROM public.suppliers WHERE shop_id = p_shop_id ORDER BY name LIMIT 300
      ) t),

    'sales', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT s.id, s.reference, s.created_at, s.subtotal, s.tax, s.discount, s.total,
               s.payment_method, s.status,
               cu.name AS customer,
               coalesce(e.name, u.email::text) AS seller,
               (SELECT coalesce(json_agg(json_build_object(
                         'name', si.name, 'quantity', si.quantity,
                         'unit_price', si.unit_price, 'total', si.total)), '[]'::json)
                  FROM public.sale_items si WHERE si.sale_id = s.id) AS items
          FROM public.sales s
          LEFT JOIN public.customers cu ON cu.id = s.customer_id
          LEFT JOIN public.employees e  ON e.id = s.employee_id
          LEFT JOIN auth.users u        ON u.id = s.cashier_id
         WHERE s.shop_id = p_shop_id ORDER BY s.created_at DESC LIMIT 200
      ) t),

    'movements', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT mv.id, mv.created_at, mv.type, mv.quantity, mv.reason, pr.name AS product
          FROM public.stock_movements mv
          LEFT JOIN public.products pr ON pr.id = mv.product_id
         WHERE mv.shop_id = p_shop_id ORDER BY mv.created_at DESC LIMIT 200
      ) t),

    'messages', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT id, employee_name, employee_role, message, created_at
          FROM public.employee_messages WHERE shop_id = p_shop_id
         ORDER BY created_at DESC LIMIT 100
      ) t),

    'imports', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT id, file_name, category_column, created_at,
               jsonb_array_length(columns) AS columns_count,
               jsonb_array_length(rows)    AS rows_count
          FROM public.imported_data WHERE shop_id = p_shop_id ORDER BY created_at DESC
      ) t),

    'audit', (SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT l.id, l.action, l.details, l.created_at, u.email::text AS admin_email
          FROM public.admin_audit_log l LEFT JOIN auth.users u ON u.id = l.admin_id
         WHERE l.target = p_shop_id::text ORDER BY l.created_at DESC LIMIT 50
      ) t)
  ) INTO r;

  RETURN r;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_shop_detail(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_shop_detail(uuid) TO authenticated;
