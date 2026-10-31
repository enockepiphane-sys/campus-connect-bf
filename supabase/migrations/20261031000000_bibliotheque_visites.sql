-- CampusLink — SQL n°2 À EXÉCUTER DANS SUPABASE (SQL Editor -> New query -> Run)
-- Bibliothèque (thèmes, documents, propositions) + comptage des visiteurs.
-- Peut être relancé sans risque : ce qui existe déjà est conservé ou remplacé proprement.
BEGIN;

-- 0) Qui est super administrateur ?
CREATE OR REPLACE FUNCTION public.est_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );
$$;
REVOKE ALL ON FUNCTION public.est_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.est_super_admin() TO authenticated, service_role;

-- 1) Thèmes de la bibliothèque
CREATE TABLE IF NOT EXISTS public.bibliotheque_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL CHECK (length(trim(nom)) BETWEEN 1 AND 80),
  description text CHECK (description IS NULL OR length(description) <= 300),
  couleur text NOT NULL DEFAULT '#0F8A44' CHECK (couleur ~ '^#[0-9a-fA-F]{6}$'),
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bibliotheque_themes_nom_uniq ON public.bibliotheque_themes (lower(nom));

INSERT INTO public.bibliotheque_themes (nom, description, couleur, ordre) VALUES
  ('Supports de cours', 'Cours, polycopiés et fascicules', '#0F8A44', 1),
  ('Romans', 'Romans et littérature', '#c2603c', 2),
  ('Histoire et récits', 'Histoire, contes et récits', '#c08a1e', 3),
  ('Sciences et techniques', 'Mathématiques, physique, informatique…', '#167d78', 4),
  ('Droit et économie', 'Droit, gestion, comptabilité, économie', '#2b3a33', 5),
  ('Développement personnel', 'Méthodes de travail, motivation, carrière', '#ea580c', 6),
  ('Concours et examens', 'Sujets et préparations', '#0b6b36', 7)
ON CONFLICT DO NOTHING;

-- 2) Documents
CREATE TABLE IF NOT EXISTS public.bibliotheque_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.bibliotheque_themes(id) ON DELETE RESTRICT,
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 1 AND 200),
  auteur text CHECK (auteur IS NULL OR length(auteur) <= 150),
  description text CHECK (description IS NULL OR length(description) <= 2000),
  fichier_path text NOT NULL,
  fichier_type text NOT NULL CHECK (fichier_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
  taille bigint,
  actif boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bibliotheque_documents_theme_idx ON public.bibliotheque_documents (theme_id);
CREATE INDEX IF NOT EXISTS bibliotheque_documents_date_idx ON public.bibliotheque_documents (created_at DESC);

CREATE OR REPLACE FUNCTION public.bibliotheque_update_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS bibliotheque_documents_updated ON public.bibliotheque_documents;
CREATE TRIGGER bibliotheque_documents_updated BEFORE UPDATE ON public.bibliotheque_documents FOR EACH ROW EXECUTE FUNCTION public.bibliotheque_update_timestamp();

-- 3) Propositions de livres faites par les étudiants
CREATE TABLE IF NOT EXISTS public.bibliotheque_propositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 2 AND 200),
  auteur text CHECK (auteur IS NULL OR length(auteur) <= 150),
  commentaire text CHECK (commentaire IS NULL OR length(commentaire) <= 1000),
  statut text NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','retenue','refusee')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Droits et règles de sécurité
GRANT SELECT ON public.bibliotheque_themes, public.bibliotheque_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bibliotheque_themes, public.bibliotheque_documents TO authenticated;
GRANT INSERT ON public.bibliotheque_propositions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.bibliotheque_propositions TO authenticated;
GRANT ALL ON public.bibliotheque_themes, public.bibliotheque_documents, public.bibliotheque_propositions TO service_role;

ALTER TABLE public.bibliotheque_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bibliotheque_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bibliotheque_propositions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS biblio_themes_lecture ON public.bibliotheque_themes;
CREATE POLICY biblio_themes_lecture ON public.bibliotheque_themes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS biblio_themes_gestion ON public.bibliotheque_themes;
CREATE POLICY biblio_themes_gestion ON public.bibliotheque_themes FOR ALL TO authenticated USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

DROP POLICY IF EXISTS biblio_docs_lecture ON public.bibliotheque_documents;
CREATE POLICY biblio_docs_lecture ON public.bibliotheque_documents FOR SELECT TO anon, authenticated USING (actif);
DROP POLICY IF EXISTS biblio_docs_gestion ON public.bibliotheque_documents;
CREATE POLICY biblio_docs_gestion ON public.bibliotheque_documents FOR ALL TO authenticated USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

DROP POLICY IF EXISTS biblio_prop_envoi ON public.bibliotheque_propositions;
CREATE POLICY biblio_prop_envoi ON public.bibliotheque_propositions FOR INSERT TO anon, authenticated WITH CHECK (statut = 'nouvelle');
DROP POLICY IF EXISTS biblio_prop_gestion ON public.bibliotheque_propositions;
CREATE POLICY biblio_prop_gestion ON public.bibliotheque_propositions FOR ALL TO authenticated USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

-- 5) Stockage des fichiers (PDF et photos, 50 Mo maximum chacun)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bibliotheque', 'bibliotheque', true, 52428800, ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS bibliotheque_fichiers_lecture ON storage.objects;
CREATE POLICY bibliotheque_fichiers_lecture ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'bibliotheque' AND public.est_super_admin());
DROP POLICY IF EXISTS bibliotheque_fichiers_ajout ON storage.objects;
CREATE POLICY bibliotheque_fichiers_ajout ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bibliotheque' AND public.est_super_admin());
DROP POLICY IF EXISTS bibliotheque_fichiers_modif ON storage.objects;
CREATE POLICY bibliotheque_fichiers_modif ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bibliotheque' AND public.est_super_admin()) WITH CHECK (bucket_id = 'bibliotheque' AND public.est_super_admin());
DROP POLICY IF EXISTS bibliotheque_fichiers_suppr ON storage.objects;
CREATE POLICY bibliotheque_fichiers_suppr ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bibliotheque' AND public.est_super_admin());

-- 6) Comptage des visiteurs (un visiteur = un appareil, compté une seule fois par période)
CREATE TABLE IF NOT EXISTS public.visites (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id text NOT NULL CHECK (length(visitor_id) BETWEEN 8 AND 64),
  page text NOT NULL CHECK (page IN ('site','revision-ia','opportunites','bibliotheque','installation')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS visites_date_idx ON public.visites (created_at);
CREATE INDEX IF NOT EXISTS visites_page_date_idx ON public.visites (page, created_at);
GRANT INSERT ON public.visites TO anon, authenticated;
GRANT ALL ON public.visites TO service_role;
ALTER TABLE public.visites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS visites_envoi ON public.visites;
CREATE POLICY visites_envoi ON public.visites FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.stats_visiteurs()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.est_super_admin() THEN
    RAISE EXCEPTION 'Accès réservé au super administrateur' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'depuis', (SELECT min(created_at) FROM public.visites),
    'total', (SELECT count(DISTINCT visitor_id) FROM public.visites WHERE page = 'site'),
    'aujourdhui', (SELECT count(DISTINCT visitor_id) FROM public.visites WHERE page = 'site' AND created_at >= date_trunc('day', now())),
    'sept_jours', (SELECT count(DISTINCT visitor_id) FROM public.visites WHERE page = 'site' AND created_at >= now() - interval '7 days'),
    'trente_jours', (SELECT count(DISTINCT visitor_id) FROM public.visites WHERE page = 'site' AND created_at >= now() - interval '30 days'),
    'installations', (SELECT count(DISTINCT visitor_id) FROM public.visites WHERE page = 'installation'),
    'outils', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('page', page, 'total', total, 'sept_jours', s7, 'trente_jours', s30) ORDER BY page)
      FROM (
        SELECT page,
               count(DISTINCT visitor_id) AS total,
               count(DISTINCT visitor_id) FILTER (WHERE created_at >= now() - interval '7 days') AS s7,
               count(DISTINCT visitor_id) FILTER (WHERE created_at >= now() - interval '30 days') AS s30
        FROM public.visites WHERE page NOT IN ('site','installation') GROUP BY page
      ) o), '[]'::jsonb),
    'par_jour', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('periode', to_char(d, 'YYYY-MM-DD'), 'visiteurs', v) ORDER BY d)
      FROM (SELECT date_trunc('day', created_at) AS d, count(DISTINCT visitor_id) AS v FROM public.visites
            WHERE page = 'site' AND created_at >= date_trunc('day', now()) - interval '29 days' GROUP BY 1) x), '[]'::jsonb),
    'par_semaine', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('periode', to_char(d, 'YYYY-MM-DD'), 'visiteurs', v) ORDER BY d)
      FROM (SELECT date_trunc('week', created_at) AS d, count(DISTINCT visitor_id) AS v FROM public.visites
            WHERE page = 'site' AND created_at >= date_trunc('week', now()) - interval '11 weeks' GROUP BY 1) x), '[]'::jsonb),
    'par_mois', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('periode', to_char(d, 'YYYY-MM-DD'), 'visiteurs', v) ORDER BY d)
      FROM (SELECT date_trunc('month', created_at) AS d, count(DISTINCT visitor_id) AS v FROM public.visites
            WHERE page = 'site' AND created_at >= date_trunc('month', now()) - interval '11 months' GROUP BY 1) x), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END
$$;
REVOKE ALL ON FUNCTION public.stats_visiteurs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stats_visiteurs() TO authenticated, service_role;

COMMIT;
