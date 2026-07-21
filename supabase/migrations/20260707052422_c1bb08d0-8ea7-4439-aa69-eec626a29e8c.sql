GRANT EXECUTE ON FUNCTION public.is_shop_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_shop_role(uuid, uuid, public.app_role) TO authenticated, anon;