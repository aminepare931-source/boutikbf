-- ============================================================
-- Table pour stocker les données importées brutes
-- Permet d'afficher les fichiers Excel tels quels
-- ============================================================

CREATE TABLE IF NOT EXISTS public.imported_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  columns JSONB NOT NULL, -- ["Colonne1", "Colonne2", ...]
  rows JSONB NOT NULL, -- [{"Colonne1": "val1", "Colonne2": "val2"}, ...]
  category_column TEXT, -- colonne utilisée comme catégorie/filtre
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imported_data_shop_id ON public.imported_data(shop_id);

ALTER TABLE public.imported_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imported_data all by shop" ON public.imported_data;
CREATE POLICY "imported_data all by shop" ON public.imported_data
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_members.shop_id = imported_data.shop_id
      AND shop_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members
      WHERE shop_members.shop_id = imported_data.shop_id
      AND shop_members.user_id = auth.uid()
    )
  );