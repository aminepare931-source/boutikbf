-- ============================================================
-- Création des buckets de stockage
-- ============================================================

-- Bucket pour les logos des boutiques
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shop-logos', 'shop-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre l'upload par les utilisateurs authentifiés
DROP POLICY IF EXISTS "shop-logos public read" ON storage.objects;
CREATE POLICY "shop-logos public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'shop-logos');

DROP POLICY IF EXISTS "shop-logos authenticated upload" ON storage.objects;
CREATE POLICY "shop-logos authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-logos');

DROP POLICY IF EXISTS "shop-logos authenticated update" ON storage.objects;
CREATE POLICY "shop-logos authenticated update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-logos')
  WITH CHECK (bucket_id = 'shop-logos');