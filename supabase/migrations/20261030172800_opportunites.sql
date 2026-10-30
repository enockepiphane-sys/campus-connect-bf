BEGIN;
-- Les super-admins existants et les admins liés à une préautorisation et
-- un établissement non supprimés peuvent gérer les offres globales.
CREATE FUNCTION public.peut_gerer_opportunites()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles r
      JOIN public.etablissements e ON e.id = r.etablissement_id
      JOIN public.admins_pre_autorises a ON a.etablissement_id = e.id
      WHERE r.user_id = auth.uid() AND r.role = 'admin'::public.app_role
        AND e.deleted_at IS NULL AND a.deleted_at IS NULL
        AND lower(a.email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );
$$;
REVOKE ALL ON FUNCTION public.peut_gerer_opportunites() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peut_gerer_opportunites() TO authenticated, service_role;

CREATE TABLE public.opportunites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 1 AND 200),
  organisme text NOT NULL CHECK (length(trim(organisme)) BETWEEN 1 AND 200),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 20000),
  conditions text NOT NULL CHECK (length(trim(conditions)) BETWEEN 1 AND 10000),
  categorie text NOT NULL CHECK (categorie IN ('Stages', 'Offres d''emploi', 'Bourses d''études', 'Concours', 'Formations', 'Appels à candidatures')),
  date_limite date NOT NULL,
  candidature text NOT NULL CHECK (length(trim(candidature)) BETWEEN 1 AND 2000),
  publie boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.opportunites TO authenticated;
GRANT UPDATE (titre, organisme, description, conditions, categorie, date_limite, candidature, publie) ON public.opportunites TO authenticated;
GRANT ALL ON public.opportunites TO service_role;
ALTER TABLE public.opportunites ENABLE ROW LEVEL SECURITY;
CREATE POLICY opportunites_lecture ON public.opportunites FOR SELECT TO authenticated USING (publie OR public.peut_gerer_opportunites());
CREATE POLICY opportunites_creation ON public.opportunites FOR INSERT TO authenticated WITH CHECK (public.peut_gerer_opportunites() AND created_by = auth.uid());
CREATE POLICY opportunites_modification ON public.opportunites FOR UPDATE TO authenticated USING (public.peut_gerer_opportunites()) WITH CHECK (public.peut_gerer_opportunites());
CREATE POLICY opportunites_suppression ON public.opportunites FOR DELETE TO authenticated USING (public.peut_gerer_opportunites());
CREATE INDEX opportunites_date_limite_idx ON public.opportunites (date_limite);
CREATE INDEX opportunites_categorie_idx ON public.opportunites (categorie);
CREATE FUNCTION public.opportunites_update_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER opportunites_updated BEFORE UPDATE ON public.opportunites FOR EACH ROW EXECUTE FUNCTION public.opportunites_update_timestamp();

CREATE TABLE public.opportunites_favoris (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunite_id uuid NOT NULL REFERENCES public.opportunites(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunite_id)
);
GRANT SELECT, INSERT, DELETE ON public.opportunites_favoris TO authenticated;
GRANT UPDATE (user_id, opportunite_id) ON public.opportunites_favoris TO authenticated;
GRANT ALL ON public.opportunites_favoris TO service_role;
ALTER TABLE public.opportunites_favoris ENABLE ROW LEVEL SECURITY;
CREATE POLICY favoris_lecture ON public.opportunites_favoris FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY favoris_creation ON public.opportunites_favoris FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.opportunites WHERE id = opportunite_id AND publie)
);
CREATE POLICY favoris_modification ON public.opportunites_favoris FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.opportunites WHERE id = opportunite_id AND publie)
);
CREATE POLICY favoris_suppression ON public.opportunites_favoris FOR DELETE TO authenticated USING (user_id = auth.uid());
COMMIT;
