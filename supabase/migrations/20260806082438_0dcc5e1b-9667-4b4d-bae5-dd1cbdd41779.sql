ALTER TABLE public.matieres ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 1;
ALTER TABLE public.annonces ADD COLUMN IF NOT EXISTS max_comments integer NOT NULL DEFAULT 10;
ALTER TABLE public.evenements ADD COLUMN IF NOT EXISTS affiche_url text;

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
  FROM public.annonces WHERE id = NEW.announcement_id;

  IF v_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Les commentaires sont désactivés pour cette annonce';
  END IF;

  SELECT count(*) INTO v_count FROM public.announcement_comments
  WHERE announcement_id = NEW.announcement_id;

  IF v_max IS NOT NULL AND v_count >= v_max THEN
    RAISE EXCEPTION 'Limite de commentaires atteinte';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_limit ON public.announcement_comments;
CREATE TRIGGER trg_comment_limit
BEFORE INSERT ON public.announcement_comments
FOR EACH ROW EXECUTE FUNCTION public.check_comment_limit();

REVOKE EXECUTE ON FUNCTION public.check_comment_limit() FROM PUBLIC, anon, authenticated;