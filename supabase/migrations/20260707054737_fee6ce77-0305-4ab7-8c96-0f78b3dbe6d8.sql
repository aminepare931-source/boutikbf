
-- Policies for shop-logos bucket (authenticated read + owner-scoped write via first path segment = shop_id)
CREATE POLICY "shop-logos read authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'shop-logos');

CREATE POLICY "shop-logos insert members" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "shop-logos update members" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "shop-logos delete members" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(((storage.foldername(name))[1])::uuid, auth.uid())
);
