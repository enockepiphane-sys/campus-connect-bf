/*
# Fix function execution permissions for RLS policies

## Problem
The functions `is_super_admin()` and `has_role()` are used in RLS policies
on `user_roles`, `super_admins`, and `admins_pre_autorises` tables. However,
their EXECUTE permission was restricted to `postgres` and `service_role` only,
meaning `authenticated` users (who need to query these tables via RLS) get
"permission denied for function is_super_admin" errors.

## Fix
Grant EXECUTE on both functions to `authenticated` and `anon` roles.
Both functions are SECURITY DEFINER, so they run with the function owner's
privileges regardless of the caller — granting EXECUTE just allows the
RLS policy to call them.
*/

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;