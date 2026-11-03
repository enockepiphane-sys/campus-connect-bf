-- CampusZoodo — À EXÉCUTER UNE FOIS DANS SUPABASE (SQL Editor -> New query -> Run)
-- Bibliothèque : documents ajoutés par lien (https) vers une autre plateforme, lus dans un lecteur intégré.
-- Un document a soit un fichier envoyé (fichier_path), soit un lien (lien_url). Peut être relancé sans risque.
BEGIN;

ALTER TABLE public.bibliotheque_documents ADD COLUMN IF NOT EXISTS lien_url text;
ALTER TABLE public.bibliotheque_documents ALTER COLUMN fichier_path DROP NOT NULL;
ALTER TABLE public.bibliotheque_documents ALTER COLUMN fichier_type DROP NOT NULL;

ALTER TABLE public.bibliotheque_documents DROP CONSTRAINT IF EXISTS bibliotheque_documents_lien_check;
ALTER TABLE public.bibliotheque_documents ADD CONSTRAINT bibliotheque_documents_lien_check
  CHECK (lien_url IS NULL OR (lien_url ~* '^https://' AND length(lien_url) <= 2000));

ALTER TABLE public.bibliotheque_documents DROP CONSTRAINT IF EXISTS bibliotheque_documents_source_check;
ALTER TABLE public.bibliotheque_documents ADD CONSTRAINT bibliotheque_documents_source_check
  CHECK (fichier_path IS NOT NULL OR lien_url IS NOT NULL);

COMMIT;
