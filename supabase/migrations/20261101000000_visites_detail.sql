-- CampusLink — SQL n°3 À EXÉCUTER DANS SUPABASE (SQL Editor -> New query -> Run)
-- Comptage des visiteurs : détail des visiteurs (pour vérifier) et remise à zéro.
-- Peut être relancé sans risque.
BEGIN;

ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS agent text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visites_agent_len') THEN
    ALTER TABLE public.visites ADD CONSTRAINT visites_agent_len CHECK (agent IS NULL OR length(agent) <= 300);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.visiteurs_detail()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.est_super_admin() THEN
    RAISE EXCEPTION 'Accès réservé au super administrateur' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object('visiteur', left(visitor_id, 8), 'premiere', premiere, 'derniere', derniere, 'actions', actions, 'agent', agent) ORDER BY premiere DESC)
    FROM (
      SELECT visitor_id, min(created_at) AS premiere, max(created_at) AS derniere, count(*) AS actions, max(agent) AS agent
      FROM public.visites GROUP BY visitor_id ORDER BY min(created_at) DESC LIMIT 100
    ) d
  ), '[]'::jsonb);
END
$$;
REVOKE ALL ON FUNCTION public.visiteurs_detail() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.visiteurs_detail() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.visites_remise_a_zero()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.est_super_admin() THEN
    RAISE EXCEPTION 'Accès réservé au super administrateur' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.visites WHERE true;
END
$$;
REVOKE ALL ON FUNCTION public.visites_remise_a_zero() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.visites_remise_a_zero() TO authenticated, service_role;

COMMIT;
