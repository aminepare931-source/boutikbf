-- Attribution des ventes aux employés (caisse PIN) — stats équipe enfin réelles.
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS employee_id UUID
  REFERENCES public.employees(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_employee ON public.sales(shop_id, employee_id, created_at DESC);
