-- ============================================================================
-- Produits : attributs libres + bucket images produits
-- À exécuter UNE FOIS (CLI).
-- ============================================================================

-- 1. Attributs supplémentaires (poids, couleur, taille, fournisseur…) ---------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}';

-- 2. Bucket pour les photos de produits ---------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 2097152,
        ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product-images public read" ON storage.objects;
CREATE POLICY "product-images public read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

-- Upload/draft : chemin = <shop_id>/<...> ; seul un membre de la boutique écrit
DROP POLICY IF EXISTS "product-images member write" ON storage.objects;
CREATE POLICY "product-images member write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_shop_member(
          (split_part(name, '/', 1))::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "product-images member update" ON storage.objects;
CREATE POLICY "product-images member update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images'
         AND public.is_shop_member((split_part(name, '/', 1))::uuid, auth.uid()))
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product-images member delete" ON storage.objects;
CREATE POLICY "product-images member delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images'
         AND public.is_shop_member((split_part(name, '/', 1))::uuid, auth.uid()));
