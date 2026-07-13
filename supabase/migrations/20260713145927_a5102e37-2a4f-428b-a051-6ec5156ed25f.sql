
-- =========================================
-- FILIÈRES
-- =========================================
CREATE TABLE public.filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (etablissement_id, nom)
);
GRANT SELECT ON public.filieres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filieres TO authenticated;
GRANT ALL ON public.filieres TO service_role;
ALTER TABLE public.filieres ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_filieres_updated
BEFORE UPDATE ON public.filieres
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- NIVEAUX
-- =========================================
CREATE TABLE public.niveaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filiere_id uuid NOT NULL REFERENCES public.filieres(id) ON DELETE CASCADE,
  nom text NOT NULL,
  ordre int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (filiere_id, nom)
);
GRANT SELECT ON public.niveaux TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.niveaux TO authenticated;
GRANT ALL ON public.niveaux TO service_role;
ALTER TABLE public.niveaux ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_niveaux_updated
BEFORE UPDATE ON public.niveaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ÉTUDIANTS PRÉ-INSCRITS
-- =========================================
CREATE TABLE public.etudiants_pre_inscrits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  filiere_id uuid NOT NULL REFERENCES public.filieres(id) ON DELETE CASCADE,
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  nom_complet text NOT NULL,
  email text NOT NULL,
  date_naissance date NOT NULL,
  inscrit boolean NOT NULL DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (etablissement_id, email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.etudiants_pre_inscrits TO authenticated;
GRANT ALL ON public.etudiants_pre_inscrits TO service_role;
ALTER TABLE public.etudiants_pre_inscrits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_etudiants_updated
BEFORE UPDATE ON public.etudiants_pre_inscrits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- MATIÈRES
-- =========================================
CREATE TABLE public.matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  nom text NOT NULL,
  coefficient numeric(4,2) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (niveau_id, nom)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matieres TO authenticated;
GRANT ALL ON public.matieres TO service_role;
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_matieres_updated
BEFORE UPDATE ON public.matieres
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- NOTES
-- =========================================
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_user_id uuid NOT NULL,
  matiere_id uuid NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  valeur numeric(5,2) NOT NULL,
  type_evaluation text NOT NULL DEFAULT 'devoir',
  commentaire text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_notes_updated
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_notes_etudiant ON public.notes(etudiant_user_id);
CREATE INDEX idx_notes_matiere ON public.notes(matiere_id);

-- =========================================
-- ANNONCES
-- =========================================
CREATE TABLE public.annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  titre text NOT NULL,
  contenu text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annonces TO authenticated;
GRANT ALL ON public.annonces TO service_role;
ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_annonces_updated
BEFORE UPDATE ON public.annonces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ÉVÉNEMENTS
-- =========================================
CREATE TABLE public.evenements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  date_evenement timestamptz NOT NULL,
  lieu text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evenements TO authenticated;
GRANT ALL ON public.evenements TO service_role;
ALTER TABLE public.evenements ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_evenements_updated
BEFORE UPDATE ON public.evenements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- EMPLOIS DU TEMPS
-- =========================================
CREATE TABLE public.emplois_du_temps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id) ON DELETE CASCADE,
  jour_semaine int NOT NULL CHECK (jour_semaine BETWEEN 1 AND 7),
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  matiere text NOT NULL,
  salle text,
  enseignant text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emplois_du_temps TO authenticated;
GRANT ALL ON public.emplois_du_temps TO service_role;
ALTER TABLE public.emplois_du_temps ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_edt_updated
BEFORE UPDATE ON public.emplois_du_temps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- FONCTIONS DE SÉCURITÉ (SECURITY DEFINER)
-- =========================================

CREATE OR REPLACE FUNCTION public.is_admin_of_etablissement(_user_id uuid, _etab_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::public.app_role
      AND etablissement_id = _etab_id
  )
$$;

CREATE OR REPLACE FUNCTION public.etablissement_of_admin(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT etablissement_id FROM public.user_roles
  WHERE user_id = _user_id AND role = 'admin'::public.app_role
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_etudiant_of_niveau(_user_id uuid, _niveau_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.etudiants_pre_inscrits
    WHERE user_id = _user_id AND niveau_id = _niveau_id AND inscrit = true
  )
$$;

CREATE OR REPLACE FUNCTION public.niveau_of_etudiant(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT niveau_id FROM public.etudiants_pre_inscrits
  WHERE user_id = _user_id AND inscrit = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.etablissement_of_niveau(_niveau_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT f.etablissement_id
  FROM public.niveaux n
  JOIN public.filieres f ON f.id = n.filiere_id
  WHERE n.id = _niveau_id
$$;

CREATE OR REPLACE FUNCTION public.verifier_etudiant_pre_inscrit(
  _etablissement_id uuid, _filiere_id uuid, _niveau_id uuid,
  _nom_complet text, _email text, _date_naissance date)
RETURNS TABLE(pre_inscription_id uuid, deja_inscrit boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.inscrit FROM public.etudiants_pre_inscrits e
  WHERE e.etablissement_id = _etablissement_id
    AND e.filiere_id = _filiere_id
    AND e.niveau_id = _niveau_id
    AND lower(trim(e.email)) = lower(trim(_email))
    AND lower(trim(e.nom_complet)) = lower(trim(_nom_complet))
    AND e.date_naissance = _date_naissance
  LIMIT 1;
END;
$$;

-- Finalisation inscription admin : à appeler juste après signUp
CREATE OR REPLACE FUNCTION public.finaliser_inscription_admin(_pre_autorisation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_etab uuid;
  v_email text;
  v_auth_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT etablissement_id, email INTO v_etab, v_email
  FROM public.admins_pre_autorises WHERE id = _pre_autorisation_id;

  IF v_etab IS NULL THEN RAISE EXCEPTION 'Pré-autorisation introuvable'; END IF;

  SELECT email INTO v_auth_email FROM auth.users WHERE id = v_uid;
  IF lower(trim(v_auth_email)) <> lower(trim(v_email)) THEN
    RAISE EXCEPTION 'Email du compte différent de la pré-autorisation';
  END IF;

  UPDATE public.admins_pre_autorises
  SET inscrit = true, user_id = v_uid
  WHERE id = _pre_autorisation_id;

  INSERT INTO public.user_roles (user_id, role, etablissement_id)
  VALUES (v_uid, 'admin'::public.app_role, v_etab)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.finaliser_inscription_etudiant(_pre_inscription_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_auth_email text;
  v_etab uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;

  SELECT email, etablissement_id INTO v_email, v_etab
  FROM public.etudiants_pre_inscrits WHERE id = _pre_inscription_id;

  IF v_email IS NULL THEN RAISE EXCEPTION 'Pré-inscription introuvable'; END IF;

  SELECT email INTO v_auth_email FROM auth.users WHERE id = v_uid;
  IF lower(trim(v_auth_email)) <> lower(trim(v_email)) THEN
    RAISE EXCEPTION 'Email du compte différent de la pré-inscription';
  END IF;

  UPDATE public.etudiants_pre_inscrits
  SET inscrit = true, user_id = v_uid
  WHERE id = _pre_inscription_id;

  INSERT INTO public.user_roles (user_id, role, etablissement_id)
  VALUES (v_uid, 'etudiant'::public.app_role, v_etab)
  ON CONFLICT DO NOTHING;
END;
$$;

-- =========================================
-- POLITIQUES RLS
-- =========================================

-- FILIÈRES : lecture publique (établissement actif) + admin gère
CREATE POLICY "Lecture publique filieres (etab actif)" ON public.filieres FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.etablissements e WHERE e.id = etablissement_id AND e.statut = 'actif'));

CREATE POLICY "Admin gère ses filières" ON public.filieres FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), etablissement_id))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), etablissement_id));

CREATE POLICY "Super admin gère filières" ON public.filieres FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- NIVEAUX : lecture publique + admin gère
CREATE POLICY "Lecture publique niveaux (etab actif)" ON public.niveaux FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.filieres f JOIN public.etablissements e ON e.id = f.etablissement_id
  WHERE f.id = filiere_id AND e.statut = 'actif'
));

CREATE POLICY "Admin gère ses niveaux" ON public.niveaux FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(),
  (SELECT etablissement_id FROM public.filieres WHERE id = filiere_id)))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(),
  (SELECT etablissement_id FROM public.filieres WHERE id = filiere_id)));

CREATE POLICY "Super admin gère niveaux" ON public.niveaux FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- ÉTUDIANTS PRÉ-INSCRITS : admin de l'établissement + l'étudiant voit sa fiche
CREATE POLICY "Admin gère les étudiants" ON public.etudiants_pre_inscrits FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), etablissement_id))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), etablissement_id));

CREATE POLICY "Étudiant voit sa fiche" ON public.etudiants_pre_inscrits FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admin voit tout" ON public.etudiants_pre_inscrits FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

-- MATIÈRES : étudiants du niveau + admin gère
CREATE POLICY "Lecture matières par niveau" ON public.matieres FOR SELECT TO authenticated
USING (
  public.is_etudiant_of_niveau(auth.uid(), niveau_id)
  OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admin gère matières" ON public.matieres FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)));

-- NOTES : chaque étudiant voit les siennes ; admin gère celles de son établissement
CREATE POLICY "Étudiant voit ses notes" ON public.notes FOR SELECT TO authenticated
USING (etudiant_user_id = auth.uid());

CREATE POLICY "Admin gère notes établissement" ON public.notes FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(),
  public.etablissement_of_niveau((SELECT niveau_id FROM public.matieres WHERE id = matiere_id))))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(),
  public.etablissement_of_niveau((SELECT niveau_id FROM public.matieres WHERE id = matiere_id))));

-- ANNONCES : étudiants du niveau + admin gère
CREATE POLICY "Lecture annonces niveau" ON public.annonces FOR SELECT TO authenticated
USING (
  public.is_etudiant_of_niveau(auth.uid(), niveau_id)
  OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id))
);

CREATE POLICY "Admin gère annonces" ON public.annonces FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)));

-- ÉVÉNEMENTS
CREATE POLICY "Lecture événements niveau" ON public.evenements FOR SELECT TO authenticated
USING (
  public.is_etudiant_of_niveau(auth.uid(), niveau_id)
  OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id))
);

CREATE POLICY "Admin gère événements" ON public.evenements FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)));

-- EMPLOIS DU TEMPS
CREATE POLICY "Lecture edt niveau" ON public.emplois_du_temps FOR SELECT TO authenticated
USING (
  public.is_etudiant_of_niveau(auth.uid(), niveau_id)
  OR public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id))
);

CREATE POLICY "Admin gère edt" ON public.emplois_du_temps FOR ALL TO authenticated
USING (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)))
WITH CHECK (public.is_admin_of_etablissement(auth.uid(), public.etablissement_of_niveau(niveau_id)));
