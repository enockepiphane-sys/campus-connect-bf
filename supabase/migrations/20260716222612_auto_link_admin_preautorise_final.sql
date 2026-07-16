/*
# Auto-link admins_pre_autorises on signup (fixed version)

## Purpose
When a new auth user is created (admin signs up via signUp), this trigger
automatically links the auth user to the matching row in admins_pre_autorises
by email, sets inscrit = true, and creates a user_roles entry with role = 'admin'.

## Safety
- Wrapped in BEGIN/exception block so trigger failures don't prevent user creation
- Uses LOWER() for case-insensitive email matching
- SECURITY DEFINER to run with elevated privileges
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
          inscrit = true,
          updated_at = now()
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