-- CampusZoodo — À EXÉCUTER UNE FOIS DANS SUPABASE (SQL Editor -> New query -> Run)
-- 1) Bibliothèque : accepter aussi les vidéos (mp4, webm, mov)
-- 2) Cours en ligne : un même cours peut appartenir à plusieurs filières
-- Peut être relancé sans risque.
BEGIN;

/* ---------- 1) Bibliothèque : vidéos ---------- */
ALTER TABLE public.bibliotheque_documents DROP CONSTRAINT IF EXISTS bibliotheque_documents_fichier_type_check;
ALTER TABLE public.bibliotheque_documents ADD CONSTRAINT bibliotheque_documents_fichier_type_check
  CHECK (fichier_type IN ('application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'));

-- Limite à 200 Mo par fichier (Supabase applique aussi la limite globale de votre offre :
-- 50 Mo en offre gratuite, à relever dans Storage > Settings si votre offre le permet).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bibliotheque', 'bibliotheque', true, 209715200,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 209715200,
  allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'];

/* ---------- 2) Cours : plusieurs filières ---------- */
-- La colonne « filiere » reste (= première filière) ; « filieres » contient la liste complète.
ALTER TABLE public.cours_en_ligne ADD COLUMN IF NOT EXISTS filieres text[];
UPDATE public.cours_en_ligne SET filieres = ARRAY[filiere] WHERE filieres IS NULL OR cardinality(filieres) = 0;
ALTER TABLE public.cours_en_ligne ALTER COLUMN filieres SET NOT NULL;
ALTER TABLE public.cours_en_ligne DROP CONSTRAINT IF EXISTS cours_filieres_check;
ALTER TABLE public.cours_en_ligne ADD CONSTRAINT cours_filieres_check CHECK (cardinality(filieres) BETWEEN 1 AND 10);
CREATE INDEX IF NOT EXISTS cours_en_ligne_filieres_idx ON public.cours_en_ligne USING gin (filieres);

COMMIT;
