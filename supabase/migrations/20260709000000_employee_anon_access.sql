-- ============================================================
-- Table des employés avec accès anonyme
-- Permet aux employés de se connecter avec PIN + nom
-- ============================================================

-- Table des employés
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cashier',
  pin TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_employees_shop_id ON public.employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_employees_pin ON public.employees(pin);
CREATE INDEX IF NOT EXISTS idx_employees_shop_pin ON public.employees(shop_id, pin);

-- RLS : les employés peuvent être lus/écrits par les admins de la boutique
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Policy pour les admins (authenticated)
DROP POLICY IF EXISTS "employees admin all by shop" ON public.employees;
CREATE POLICY "employees admin all by shop" ON public.employees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_members.shop_id = employees.shop_id
      AND shop_members.user_id = auth.uid()
      AND shop_members.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_members.shop_id = employees.shop_id
      AND shop_members.user_id = auth.uid()
      AND shop_members.role IN ('admin', 'manager')
    )
  );

-- Policy pour l'accès anonyme (employés qui se connectent)
DROP POLICY IF EXISTS "employees anon read by shop and pin" ON public.employees;
CREATE POLICY "employees anon read by shop and pin" ON public.employees
  FOR SELECT TO anon
  USING (true);

-- Note : l'accès anonyme est ouvert pour permettre la connexion par PIN
-- La vérification du PIN et du nom se fait dans le frontend