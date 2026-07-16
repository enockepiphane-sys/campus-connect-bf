/*
# Auto-link admins_pre_autorises on signup (fixed version)

## Purpose
When a new auth user is created (admin signs up via signUp), this trigger
automatically links the auth user to the matching row in admins_pre_autorises
by email, sets inscrit = true, and creates a user_roles entry with role = 'admin'.

## Fix from previous version
- Wrapped the entire function body in a BEGIN/exception block so that if any
  step fails (FK constraint, RLS, etc.), the trigger does NOT prevent user
  creation. The user is always returned (RETURN NEW), and the linking is
  best-effort.
- Uses LOWER() on both sides for email comparison.

## Changes
1. Creates function `link_admin_preautorise()` (SECURITY DEFINER)
2. Creates trigger `on_auth_user_created_link_admin` on auth.users AFTER INSERT
*/

CREATE OR REPLACE FUNCTION public.link_admin_preautorise()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_etab_id uuid;
BEGIN
  -- Only proceed if the new user has an email
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    -- Find matching pre-authorized admin
    SELECT id, etablissement_id INTO v_admin_id, v_etab_id
    FROM admins_pre_autorises
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF v_admin_id IS NOT NULL THEN
      -- Link the user_id and mark as inscrit
      UPDATE admins_pre_autorises
      SET user_id = NEW.id,
          inscrit = true,
          updated_at = now()
      WHERE id = v_admin_id;

      -- Create user_roles entry
      INSERT INTO user_roles (user_id, role, etablissement_id)
      VALUES (NEW.id, 'admin'::app_role, v_etab_id)
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Best-effort: if linking fails, still allow user creation
    RAISE NOTICE 'link_admin_preautorise failed for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_link_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_admin_preautorise();