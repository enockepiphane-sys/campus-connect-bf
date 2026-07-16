DROP TRIGGER IF EXISTS on_auth_user_created_link_admin ON auth.users;
DROP FUNCTION IF EXISTS public.link_admin_preautorise();