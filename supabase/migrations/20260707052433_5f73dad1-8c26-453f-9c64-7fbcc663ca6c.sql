REVOKE EXECUTE ON FUNCTION public.is_shop_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_shop_role(uuid, uuid, public.app_role) FROM anon, PUBLIC;