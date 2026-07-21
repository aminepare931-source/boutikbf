
REVOKE EXECUTE ON FUNCTION public.is_shop_member(UUID,UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_shop_role(UUID,UUID,app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
