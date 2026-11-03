-- Images associées aux contenus publiés (opportunités, guide, cours en ligne, bibliothèque).
-- À exécuter une seule fois dans Supabase (SQL Editor) ou via la CLI.
BEGIN;

ALTER TABLE public.opportunites          ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.cours_en_ligne        ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.guide_articles        ADD COLUMN IF NOT EXISTS image_path text;
ALTER TABLE public.bibliotheque_documents ADD COLUMN IF NOT EXISTS image_path text;

-- Les mises à jour d'opportunités sont limitées colonne par colonne : on autorise la nouvelle colonne.
GRANT UPDATE (image_path) ON public.opportunites TO authenticated;

-- Bucket public (lecture libre, comme les autres images du site), 5 Mo max, JPG/PNG/WebP.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contenu-images', 'contenu-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Seuls les super administrateurs et les gestionnaires d'opportunités peuvent ajouter ou supprimer.
DROP POLICY IF EXISTS contenu_images_ajout ON storage.objects;
CREATE POLICY contenu_images_ajout ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contenu-images' AND (public.est_super_admin() OR public.peut_gerer_opportunites()));
DROP POLICY IF EXISTS contenu_images_suppr ON storage.objects;
CREATE POLICY contenu_images_suppr ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contenu-images' AND (public.est_super_admin() OR public.peut_gerer_opportunites()));

COMMIT;
