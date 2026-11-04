-- Compteur d'utilisateurs : seules les personnes ayant ouvert au moins leur compte primaire
-- (donc connectées) sont comptées. Un utilisateur = un compte (et non plus un appareil).
-- Sans risque à relancer.

ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- Les anciennes visites anonymes sont mises de côté (archivées), pas détruites.
CREATE TABLE IF NOT EXISTS public.visites_anonymes_archive (LIKE public.visites INCLUDING DEFAULTS);
GRANT ALL ON public.visites_anonymes_archive TO service_role;
ALTER TABLE public.visites_anonymes_archive ENABLE ROW LEVEL SECURITY;
INSERT INTO public.visites_anonymes_archive SELECT * FROM public.visites WHERE user_id IS NULL;
DELETE FROM public.visites WHERE user_id IS NULL;

-- Les visiteurs non connectés ne peuvent plus être enregistrés.
REVOKE INSERT ON public.visites FROM anon;
GRANT INSERT ON public.visites TO authenticated;
DROP POLICY IF EXISTS visites_envoi ON public.visites;
CREATE POLICY visites_envoi ON public.visites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND visitor_id = auth.uid()::text);

CREATE INDEX IF NOT EXISTS visites_user_idx ON public.visites (user_id);
NOTIFY pgrst, 'reload schema';
