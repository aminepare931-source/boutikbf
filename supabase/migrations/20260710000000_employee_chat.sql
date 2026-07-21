-- ============================================================
-- Chat interne entre employés
-- Permet la communication entre vendeurs, gérants et comptables
-- ============================================================

-- Table des messages
CREATE TABLE IF NOT EXISTS public.employee_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_employee_messages_shop_id ON public.employee_messages(shop_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_created_at ON public.employee_messages(created_at DESC);

-- RLS : les employés peuvent lire/écrire les messages de leur boutique
ALTER TABLE public.employee_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_messages anon all by shop" ON public.employee_messages;
CREATE POLICY "employee_messages anon all by shop" ON public.employee_messages
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Note : les policies sont ouvertes car l'accès est géré par le frontend
-- (vérification du rôle et du shop_id via la session localStorage)