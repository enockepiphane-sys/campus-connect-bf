/*
# Temporarily drop auto-link trigger to allow manual user creation

The trigger was causing a 500 error during signUp because it fires
AFTER INSERT on auth.users and the function may fail on the user_roles
insert (RLS or FK constraint issues). We'll recreate it after fixing.
*/

DROP TRIGGER IF EXISTS on_auth_user_created_link_admin ON auth.users;
DROP FUNCTION IF EXISTS public.link_admin_preautorise();