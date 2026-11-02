-- Marché étudiant CampusLink : annonces (livres, documents, services, colocation, matériel)
-- Aucun paiement dans l'application : les étudiants se contactent directement.
-- Prérequis : la fonction public.est_super_admin() existe déjà (migration bibliotheque_visites).
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.

/* ===================== ANNONCES ===================== */
CREATE TABLE IF NOT EXISTS public.marche_annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  auteur_nom text NOT NULL CHECK (length(trim(auteur_nom)) BETWEEN 2 AND 80),
  type_annonce text NOT NULL CHECK (type_annonce IN ('vente', 'recherche', 'service', 'colocation')),
  categorie text NOT NULL CHECK (categorie IN ('Livres', 'Documents & cours', 'Services', 'Colocation & logement', 'Matériel & autres')),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 3 AND 120),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 10 AND 3000),
  prix integer CHECK (prix IS NULL OR (prix >= 0 AND prix <= 100000000)),
  ville text NOT NULL CHECK (length(trim(ville)) BETWEEN 2 AND 80),
  universite text CHECK (universite IS NULL OR length(universite) <= 120),
  contact text NOT NULL CHECK (contact ~ '^[0-9+ ().-]{6,30}$'),
  photos text[] NOT NULL DEFAULT '{}' CHECK (cardinality(photos) <= 3),
  statut text NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'terminee')),
  masquee boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marche_annonces_created_idx ON public.marche_annonces (created_at DESC);
CREATE INDEX IF NOT EXISTS marche_annonces_categorie_idx ON public.marche_annonces (categorie);
CREATE INDEX IF NOT EXISTS marche_annonces_user_idx ON public.marche_annonces (user_id);

ALTER TABLE public.marche_annonces ENABLE ROW LEVEL SECURITY;

-- Les visiteurs sans compte voient les annonces, mais PAS le numéro de contact (colonne exclue).
REVOKE ALL ON public.marche_annonces FROM anon, authenticated;
GRANT SELECT (id, user_id, auteur_nom, type_annonce, categorie, titre, description, prix, ville, universite, photos, statut, masquee, created_at, updated_at)
  ON public.marche_annonces TO anon;
GRANT SELECT, INSERT, DELETE ON public.marche_annonces TO authenticated;
-- « masquee » n'est modifiable que par la modération (fonction marche_moderer).
GRANT UPDATE (auteur_nom, type_annonce, categorie, titre, description, prix, ville, universite, contact, photos, statut)
  ON public.marche_annonces TO authenticated;
GRANT ALL ON public.marche_annonces TO service_role;

DROP POLICY IF EXISTS marche_lecture_publique ON public.marche_annonces;
CREATE POLICY marche_lecture_publique ON public.marche_annonces FOR SELECT TO anon
  USING (statut = 'active' AND NOT masquee);
DROP POLICY IF EXISTS marche_lecture ON public.marche_annonces;
CREATE POLICY marche_lecture ON public.marche_annonces FOR SELECT TO authenticated
  USING ((statut = 'active' AND NOT masquee) OR user_id = auth.uid() OR public.est_super_admin());
DROP POLICY IF EXISTS marche_creation ON public.marche_annonces;
CREATE POLICY marche_creation ON public.marche_annonces FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND masquee = false);
DROP POLICY IF EXISTS marche_modification ON public.marche_annonces;
CREATE POLICY marche_modification ON public.marche_annonces FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS marche_suppression ON public.marche_annonces;
CREATE POLICY marche_suppression ON public.marche_annonces FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.est_super_admin());

-- Date de mise à jour automatique
CREATE OR REPLACE FUNCTION public.marche_update_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS marche_annonces_updated ON public.marche_annonces;
CREATE TRIGGER marche_annonces_updated BEFORE UPDATE ON public.marche_annonces
  FOR EACH ROW EXECUTE FUNCTION public.marche_update_timestamp();

-- Anti-spam : 20 annonces actives au maximum par personne
CREATE OR REPLACE FUNCTION public.marche_limite_annonces() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.marche_annonces WHERE user_id = NEW.user_id AND statut = 'active') >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 annonces actives atteinte' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS marche_annonces_limite ON public.marche_annonces;
CREATE TRIGGER marche_annonces_limite BEFORE INSERT ON public.marche_annonces
  FOR EACH ROW EXECUTE FUNCTION public.marche_limite_annonces();

/* ===================== SIGNALEMENTS ===================== */
CREATE TABLE IF NOT EXISTS public.marche_signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES public.marche_annonces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  motif text NOT NULL CHECK (motif IN ('arnaque', 'contenu_inapproprie', 'doublon', 'autre')),
  details text CHECK (details IS NULL OR length(details) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (annonce_id, user_id)
);
ALTER TABLE public.marche_signalements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marche_signalements FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.marche_signalements TO authenticated;
GRANT ALL ON public.marche_signalements TO service_role;

DROP POLICY IF EXISTS marche_signal_creation ON public.marche_signalements;
CREATE POLICY marche_signal_creation ON public.marche_signalements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.marche_annonces a WHERE a.id = annonce_id AND a.user_id <> auth.uid()));
DROP POLICY IF EXISTS marche_signal_lecture ON public.marche_signalements;
CREATE POLICY marche_signal_lecture ON public.marche_signalements FOR SELECT TO authenticated
  USING (public.est_super_admin());
DROP POLICY IF EXISTS marche_signal_suppression ON public.marche_signalements;
CREATE POLICY marche_signal_suppression ON public.marche_signalements FOR DELETE TO authenticated
  USING (public.est_super_admin());

-- Une annonce signalée par 3 personnes différentes est masquée automatiquement, en attendant la modération.
CREATE OR REPLACE FUNCTION public.marche_auto_masquage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.marche_signalements WHERE annonce_id = NEW.annonce_id) >= 3 THEN
    UPDATE public.marche_annonces SET masquee = true WHERE id = NEW.annonce_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS marche_signalements_auto ON public.marche_signalements;
CREATE TRIGGER marche_signalements_auto AFTER INSERT ON public.marche_signalements
  FOR EACH ROW EXECUTE FUNCTION public.marche_auto_masquage();

/* ===================== MODÉRATION (super administrateur) ===================== */
CREATE OR REPLACE FUNCTION public.marche_moderer(p_id uuid, p_masquer boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.est_super_admin() THEN
    RAISE EXCEPTION 'Action réservée au super administrateur' USING ERRCODE = '42501';
  END IF;
  UPDATE public.marche_annonces SET masquee = p_masquer WHERE id = p_id;
  IF NOT p_masquer THEN
    DELETE FROM public.marche_signalements WHERE annonce_id = p_id;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.marche_moderer(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marche_moderer(uuid, boolean) TO authenticated, service_role;

/* ===================== PHOTOS (stockage) ===================== */
-- 5 Mo maximum par photo ; chaque personne n'écrit que dans son propre dossier (<user_id>/...).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marche-photos', 'marche-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS marche_photos_ajout ON storage.objects;
CREATE POLICY marche_photos_ajout ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marche-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS marche_photos_lecture_proprio ON storage.objects;
CREATE POLICY marche_photos_lecture_proprio ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'marche-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.est_super_admin()));
DROP POLICY IF EXISTS marche_photos_suppression ON storage.objects;
CREATE POLICY marche_photos_suppression ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marche-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.est_super_admin()));
