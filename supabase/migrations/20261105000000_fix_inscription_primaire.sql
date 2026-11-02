-- CampusLink : correctif de l'inscription PRIMAIRE (membres).
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor > New query > Run.
-- Peut être relancé sans risque. NE TOUCHE PAS à l'inscription secondaire (étudiants / admins pré-inscrits).

-- 1) Table des profils membres (créée si elle n'existe pas encore)
CREATE TABLE IF NOT EXISTS public.membres (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_profil text NOT NULL CHECK (length(trim(nom_profil)) BETWEEN 2 AND 60),
  telephone text NOT NULL UNIQUE CHECK (telephone ~ '^[0-9]{8,15}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.membres TO authenticated;
GRANT ALL ON public.membres TO service_role;
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS membres_lecture ON public.membres;
CREATE POLICY membres_lecture ON public.membres FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS membres_ajout ON public.membres;
CREATE POLICY membres_ajout ON public.membres FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS membres_modif ON public.membres;
CREATE POLICY membres_modif ON public.membres FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Le super administrateur peut voir tous les membres (si la fonction existe)
DO $$
BEGIN
  IF to_regprocedure('public.est_super_admin()') IS NOT NULL THEN
    DROP POLICY IF EXISTS membres_lecture_super_admin ON public.membres;
    CREATE POLICY membres_lecture_super_admin ON public.membres FOR SELECT TO authenticated
      USING (public.est_super_admin());
  END IF;
END $$;

-- 2) Confirmation automatique des comptes membres (leur « email » est fictif : numéro@membre.campuslink.bf)
CREATE OR REPLACE FUNCTION public.membre_confirmer_auto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF lower(NEW.email) LIKE '%@membre.campuslink.bf' THEN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS membre_confirmer_auto_trg ON auth.users;
CREATE TRIGGER membre_confirmer_auto_trg
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.membre_confirmer_auto();

-- 3) Création automatique du profil membre (ne bloque jamais l'inscription en cas d'erreur)
CREATE OR REPLACE FUNCTION public.membre_creer_profil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_tel text;
  v_nom text;
BEGIN
  IF lower(NEW.email) LIKE '%@membre.campuslink.bf' THEN
    BEGIN
      v_tel := split_part(NEW.email, '@', 1);
      v_nom := left(trim(COALESCE(NEW.raw_user_meta_data->>'nom_profil', '')), 60);
      IF length(v_nom) < 2 THEN v_nom := 'Membre'; END IF;
      IF v_tel ~ '^[0-9]{8,15}$' THEN
        INSERT INTO public.membres (user_id, nom_profil, telephone)
        VALUES (NEW.id, v_nom, v_tel)
        ON CONFLICT DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS membre_creer_profil_trg ON auth.users;
CREATE TRIGGER membre_creer_profil_trg
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.membre_creer_profil();

-- 4) Réparation : confirmer les comptes membres déjà créés mais restés « non confirmés »
UPDATE auth.users
SET email_confirmed_at = now()
WHERE lower(email) LIKE '%@membre.campuslink.bf' AND email_confirmed_at IS NULL;
