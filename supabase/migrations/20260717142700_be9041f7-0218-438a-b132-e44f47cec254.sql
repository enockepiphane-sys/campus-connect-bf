
-- 1. Rotate the previously leaked super admin password to an unknowable random value.
--    The plaintext password '@#epiphane226#@' was committed to a prior migration file.
--    That credential is now invalidated. The user must use the password reset flow.
DO $$
DECLARE
  v_random_pw text := encode(gen_random_bytes(48), 'hex');
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(v_random_pw, gen_salt('bf')),
      updated_at = now()
  WHERE email = 'enocksaouadogo@gmail.com';
END $$;

-- 2. Lock down SECURITY DEFINER functions: revoke from PUBLIC and anon where not needed.
--    - verifier_* : called during signup, need anon
--    - finaliser_* : called after signup, need authenticated only
--    - helper predicates (has_role, is_*, niveau_of_etudiant, etablissement_of_*):
--      only used inside RLS policies restricted to {authenticated}; authenticated keeps EXECUTE.

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_of_etablissement(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_etudiant_of_niveau(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.niveau_of_etudiant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.etablissement_of_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.etablissement_of_niveau(uuid) FROM PUBLIC, anon;

REVOKE ALL ON FUNCTION public.finaliser_inscription_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finaliser_inscription_etudiant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finaliser_inscription_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finaliser_inscription_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finaliser_inscription_etudiant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finaliser_inscription_super_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.verifier_admin_pre_autorise(uuid, text, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verifier_etudiant_pre_inscrit(uuid, uuid, uuid, text, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verifier_super_admin_pre_autorise(text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verifier_admin_pre_autorise(uuid, text, text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verifier_etudiant_pre_inscrit(uuid, uuid, uuid, text, text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verifier_super_admin_pre_autorise(text, text, date) TO anon, authenticated;

-- 3. Fix RLS "always true" INSERT policy on demandes_partenariat: enforce status='en_attente'
--    and basic input validation via a CHECK expression in WITH CHECK.
DROP POLICY IF EXISTS "Tout le monde peut soumettre une demande" ON public.demandes_partenariat;

CREATE POLICY "Tout le monde peut soumettre une demande"
ON public.demandes_partenariat
FOR INSERT
TO anon, authenticated
WITH CHECK (
  statut = 'en_attente'
  AND length(trim(nom_etablissement)) BETWEEN 2 AND 200
  AND length(trim(nom_contact)) BETWEEN 2 AND 200
  AND email_contact ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(email_contact) <= 320
  AND (telephone_contact IS NULL OR length(telephone_contact) <= 40)
  AND (message IS NULL OR length(message) <= 2000)
);
