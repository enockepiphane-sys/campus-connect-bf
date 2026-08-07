CREATE TABLE public.cours_emploi_temps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  jour_semaine integer NOT NULL CHECK (jour_semaine BETWEEN 1 AND 6),
  bloc text NOT NULL CHECK (bloc IN ('matin','apres_midi')),
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  matiere text NOT NULL,
  professeur text,
  salle text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cours_emploi_temps TO authenticated;
GRANT ALL ON public.cours_emploi_temps TO service_role;

ALTER TABLE public.cours_emploi_temps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Etudiants lisent l'emploi du temps de leur niveau"
ON public.cours_emploi_temps FOR SELECT TO authenticated
USING (
  public.is_etudiant_of_niveau(auth.uid(), niveau_id)
  OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id))
);

CREATE POLICY "Admins gerent l'emploi du temps de leur etablissement"
ON public.cours_emploi_temps FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)));

CREATE INDEX idx_cours_edt_niveau ON public.cours_emploi_temps (niveau_id, jour_semaine, heure_debut);

CREATE TRIGGER trg_cours_edt_updated
BEFORE UPDATE ON public.cours_emploi_temps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TABLE IF EXISTS public.emplois_du_temps;