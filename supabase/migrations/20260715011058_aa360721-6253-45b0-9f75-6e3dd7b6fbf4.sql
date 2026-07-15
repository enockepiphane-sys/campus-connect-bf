
ALTER TABLE public.super_admins
  ADD COLUMN IF NOT EXISTS nom_complet text,
  ADD COLUMN IF NOT EXISTS date_naissance date,
  ADD COLUMN IF NOT EXISTS inscrit boolean NOT NULL DEFAULT false;

-- Marquer comme inscrit ceux qui ont déjà un user_id
UPDATE public.super_admins SET inscrit = true WHERE user_id IS NOT NULL AND inscrit = false;

-- Mise à jour de la ligne existante d'Enock (pas de doublon possible : email UNIQUE)
UPDATE public.super_admins
SET nom_complet = 'SAOUADOGO Wendyam Enock Epiphane',
    date_naissance = '2003-01-05'::date,
    inscrit = true
WHERE email = 'enocksaouadogo@gmail.com';

-- Vérification : le pré-enregistrement d'un super admin par email/nom/date
CREATE OR REPLACE FUNCTION public.verifier_super_admin_pre_autorise(
  _nom_complet text, _email text, _date_naissance date
) RETURNS TABLE(super_admin_id uuid, deja_inscrit boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.inscrit
  FROM public.super_admins s
  WHERE lower(trim(s.email)) = lower(trim(_email))
    AND (
      s.nom_complet IS NULL
      OR lower(trim(s.nom_complet)) = lower(trim(_nom_complet))
    )
    AND (s.date_naissance IS NULL OR s.date_naissance = _date_naissance)
  LIMIT 1;
END;
$$;

-- Finalisation : lie l'utilisateur authentifié à sa ligne super_admins et lui attribue le rôle
CREATE OR REPLACE FUNCTION public.finaliser_inscription_super_admin(_super_admin_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_auth_email text;
  v_nom text;
  v_date date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT email, nom_complet, date_naissance INTO v_email, v_nom, v_date
  FROM public.super_admins WHERE id = _super_admin_id;

  IF v_email IS NULL THEN RAISE EXCEPTION 'Enregistrement super admin introuvable'; END IF;

  SELECT email INTO v_auth_email FROM auth.users WHERE id = v_uid;
  IF lower(trim(v_auth_email)) <> lower(trim(v_email)) THEN
    RAISE EXCEPTION 'Email du compte différent du super administrateur';
  END IF;

  UPDATE public.super_admins
  SET user_id = v_uid, inscrit = true
  WHERE id = _super_admin_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'super_admin'::public.app_role)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifier_super_admin_pre_autorise(text, text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finaliser_inscription_super_admin(uuid) TO authenticated;
