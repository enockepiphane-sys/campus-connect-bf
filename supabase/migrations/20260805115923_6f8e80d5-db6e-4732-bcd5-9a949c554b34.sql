ALTER TABLE public.annonces
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.announcement_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.annonces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.announcement_likes TO authenticated;
GRANT ALL ON public.announcement_likes TO service_role;
ALTER TABLE public.announcement_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture likes du niveau" ON public.announcement_likes
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.annonces a
  WHERE a.id = announcement_likes.announcement_id
    AND (public.is_etudiant_of_niveau(auth.uid(), a.niveau_id)
      OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(a.niveau_id)))
));

CREATE POLICY "Étudiant crée son like" ON public.announcement_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.annonces a
  WHERE a.id = announcement_likes.announcement_id
    AND public.is_etudiant_of_niveau(auth.uid(), a.niveau_id)
));

CREATE POLICY "Étudiant supprime son like" ON public.announcement_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.announcement_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.annonces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.announcement_comments TO authenticated;
GRANT ALL ON public.announcement_comments TO service_role;
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture commentaires du niveau" ON public.announcement_comments
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.annonces a
  WHERE a.id = announcement_comments.announcement_id
    AND (public.is_etudiant_of_niveau(auth.uid(), a.niveau_id)
      OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(a.niveau_id)))
));

CREATE POLICY "Étudiant publie un commentaire" ON public.announcement_comments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND length(trim(content)) BETWEEN 1 AND 2000 AND EXISTS (
  SELECT 1 FROM public.annonces a
  WHERE a.id = announcement_comments.announcement_id
    AND a.comments_enabled = true
    AND public.is_etudiant_of_niveau(auth.uid(), a.niveau_id)
));

CREATE POLICY "Admin ou auteur supprime un commentaire" ON public.announcement_comments
FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.annonces a
  WHERE a.id = announcement_comments.announcement_id
    AND public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(a.niveau_id))
));

CREATE INDEX IF NOT EXISTS idx_announcement_likes_ann ON public.announcement_likes(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_ann ON public.announcement_comments(announcement_id);