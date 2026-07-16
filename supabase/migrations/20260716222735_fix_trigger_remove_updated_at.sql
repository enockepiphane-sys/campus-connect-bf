/*
# Fix auto-link trigger: remove non-existent updated_at column

## Problem
The trigger function `link_admin_preautorise()` was trying to SET `updated_at = now()`
on `admins_pre_autorises`, but that table has no `updated_at` column. This caused
the trigger to fail silently (caught by the exception handler), preventing
auto-linking of new admin users.

## Fix
Remove the `updated_at` reference from the UPDATE statement.
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
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT id, etablissement_id INTO v_admin_id, v_etab_id
    FROM admins_pre_autorises
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF v_admin_id IS NOT NULL THEN
      UPDATE admins_pre_autorises
      SET user_id = NEW.id,
          inscrit = true
      WHERE id = v_admin_id;

      INSERT INTO user_roles (user_id, role, etablissement_id)
      VALUES (NEW.id, 'admin'::app_role, v_etab_id)
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
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