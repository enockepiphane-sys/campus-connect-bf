-- CampusLink — Propositions de cours faites par les utilisateurs (comme pour la bibliothèque)
-- À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> Run).
-- Prérequis : la fonction public.est_super_admin() existe déjà (migration bibliotheque_visites).
-- Peut être relancé sans risque.
BEGIN;

CREATE TABLE IF NOT EXISTS public.cours_propositions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 2 AND 200),
  filiere text CHECK (filiere IS NULL OR length(filiere) <= 100),
  niveau text CHECK (niveau IS NULL OR niveau IN ('L1','L2','L3','M1','M2','Doctorat','BTS 1','BTS 2','Autre')),
  module text CHECK (module IS NULL OR length(module) <= 150),
  commentaire text CHECK (commentaire IS NULL OR length(commentaire) <= 1000),
  statut text NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','retenue','refusee')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.cours_propositions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cours_propositions TO authenticated;
GRANT ALL ON public.cours_propositions TO service_role;

ALTER TABLE public.cours_propositions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cours_prop_envoi ON public.cours_propositions;
CREATE POLICY cours_prop_envoi ON public.cours_propositions FOR INSERT TO anon, authenticated WITH CHECK (statut = 'nouvelle');
DROP POLICY IF EXISTS cours_prop_gestion ON public.cours_propositions;
CREATE POLICY cours_prop_gestion ON public.cours_propositions FOR ALL TO authenticated USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

COMMIT;
