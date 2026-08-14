CREATE OR REPLACE FUNCTION public.finaliser_inscription_admin_par_email()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_pre_autorisation_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_auth_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_auth_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT a.id INTO v_pre_autorisation_id
  FROM public.admins_pre_autorises a
  WHERE lower(trim(a.email)) = lower(trim(v_auth_email))
    AND (a.user_id IS NULL OR a.user_id = v_uid)
  ORDER BY CASE WHEN a.user_id = v_uid THEN 0 ELSE 1 END, a.created_at DESC
  LIMIT 1;

  IF v_pre_autorisation_id IS NULL THEN
    RETURN false;
  END IF;

  PERFORM public.finaliser_inscription_admin(v_pre_autorisation_id);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.finaliser_inscription_etudiant_par_email()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_auth_email text;
  v_pre_inscription_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_auth_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_auth_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT e.id INTO v_pre_inscription_id
  FROM public.etudiants_pre_inscrits e
  WHERE lower(trim(e.email)) = lower(trim(v_auth_email))
    AND (e.user_id IS NULL OR e.user_id = v_uid)
  ORDER BY CASE WHEN e.user_id = v_uid THEN 0 ELSE 1 END, e.created_at DESC
  LIMIT 1;

  IF v_pre_inscription_id IS NULL THEN
    RETURN false;
  END IF;

  PERFORM public.finaliser_inscription_etudiant(v_pre_inscription_id);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.finaliser_inscription_admin_par_email() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finaliser_inscription_etudiant_par_email() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.finaliser_inscription_admin_par_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.finaliser_inscription_etudiant_par_email() TO authenticated;
