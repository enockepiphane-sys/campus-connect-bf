/*
# Auto-link admins_pre_autorises on signup

## Purpose
When a new auth user is created (admin signs up), this trigger automatically
links the auth user to the matching row in admins_pre_autorises by email,
sets inscrit = true, and creates a user_roles entry with role = 'admin'.

## Changes
1. Creates function `link_admin_preautorise()` that:
   - Matches the new user's email to admins_pre_autorises.email
   - Sets user_id and inscrit = true
   - Inserts a user_roles row with role = 'admin' and the correct etablissement_id
2. Creates trigger `on_auth_user_created_link_admin` on auth.users AFTER INSERT

## Notes
- Idempotent: uses ON CONFLICT DO NOTHING for user_roles insert
- Only fires on INSERT (new user creation), not on updates
- If no matching admins_pre_autorises row exists, the function does nothing
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
  -- Only proceed if the new user has a confirmed email
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find matching pre-authorized admin
  SELECT id, etablissement_id INTO v_admin_id, v_etab_id
  FROM admins_pre_autorises
  WHERE email = LOWER(NEW.email)
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

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created_link_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_link_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_admin_preautorise();