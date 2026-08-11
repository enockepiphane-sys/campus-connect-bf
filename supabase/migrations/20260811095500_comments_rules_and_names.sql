CREATE OR REPLACE FUNCTION public.check_comment_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max integer;
  v_enabled boolean;
  v_count integer;
BEGIN
  SELECT max_comments, comments_enabled INTO v_max, v_enabled
  FROM public.annonces
  WHERE id = NEW.announcement_id
  FOR UPDATE;

  IF v_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Les commentaires sont désactivés pour cette annonce';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.announcement_comments c
    WHERE c.announcement_id = NEW.announcement_id
      AND c.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Un étudiant ne peut publier qu''un seul commentaire par annonce';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.announcement_comments
  WHERE announcement_id = NEW.announcement_id;

  IF v_max IS NOT NULL AND v_count >= v_max THEN
    RAISE EXCEPTION 'Limite de commentaires atteinte';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_comment_limit() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_announcement_comments(p_announcement_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  user_id uuid,
  author_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.annonces a
    WHERE a.id = p_announcement_id
      AND (
        public.is_etudiant_of_niveau(auth.uid(), a.niveau_id)
        OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(a.niveau_id))
        OR public.is_super_admin(auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.content,
    c.created_at,
    c.user_id,
    e.nom_complet::text AS author_name
  FROM public.announcement_comments c
  LEFT JOIN public.etudiants_pre_inscrits e ON e.user_id = c.user_id
  WHERE c.announcement_id = p_announcement_id
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_announcement_comments(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_announcement_comments(uuid) FROM PUBLIC, anon;
