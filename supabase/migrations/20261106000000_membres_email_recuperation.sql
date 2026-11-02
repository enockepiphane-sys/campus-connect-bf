-- CampusLink : email de récupération FACULTATIF pour l'inscription PRIMAIRE (membres) uniquement.
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor (après 20261105000000_fix_inscription_primaire.sql).
-- Aucun lien avec les comptes étudiants / administrateurs (inscription secondaire).

ALTER TABLE public.membres ADD COLUMN IF NOT EXISTS email_recuperation text
  CHECK (email_recuperation IS NULL OR email_recuperation ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$');

-- Codes de réinitialisation (accessibles uniquement par le serveur : aucune règle publique)
CREATE TABLE IF NOT EXISTS public.membres_reinit (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expire_le timestamptz NOT NULL,
  essais integer NOT NULL DEFAULT 0,
  cree_le timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membres_reinit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.membres_reinit FROM anon, authenticated;
GRANT ALL ON public.membres_reinit TO service_role;

-- Le profil créé automatiquement reprend aussi l'email de récupération
CREATE OR REPLACE FUNCTION public.membre_creer_profil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_tel text;
  v_nom text;
  v_mail text;
BEGIN
  IF lower(NEW.email) LIKE '%@membre.campuslink.bf' THEN
    BEGIN
      v_tel := split_part(NEW.email, '@', 1);
      v_nom := left(trim(COALESCE(NEW.raw_user_meta_data->>'nom_profil', '')), 60);
      IF length(v_nom) < 2 THEN v_nom := 'Membre'; END IF;
      v_mail := NULLIF(lower(trim(COALESCE(NEW.raw_user_meta_data->>'email_recuperation', ''))), '');
      IF v_mail IS NOT NULL AND v_mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' THEN v_mail := NULL; END IF;
      IF v_tel ~ '^[0-9]{8,15}$' THEN
        INSERT INTO public.membres (user_id, nom_profil, telephone, email_recuperation)
        VALUES (NEW.id, v_nom, v_tel, v_mail)
        ON CONFLICT DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END $$;
