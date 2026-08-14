-- Campus Link
-- Champs de fiche étudiant configurables par établissement.
-- Cette migration ne crée aucune configuration par défaut pour les établissements existants.

-- Les champs historiques restent inchangés et ces deux nouveaux champs sont nullable
-- afin de préserver toutes les pré-inscriptions déjà présentes.
ALTER TABLE public.etudiants_pre_inscrits
  ADD COLUMN IF NOT EXISTS matricule text,
  ADD COLUMN IF NOT EXISTS telephone text;

-- Une seule configuration de format par établissement.
CREATE TABLE public.etablissements_champs_config (
  etablissement_id uuid NOT NULL
    REFERENCES public.etablissements(id) ON DELETE CASCADE,
  matricule_actif boolean NOT NULL DEFAULT false,
  matricule_obligatoire boolean NOT NULL DEFAULT false,
  telephone_actif boolean NOT NULL DEFAULT false,
  telephone_obligatoire boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT etablissements_champs_config_etablissement_id_key
    UNIQUE (etablissement_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.etablissements_champs_config TO authenticated;
GRANT ALL ON public.etablissements_champs_config TO service_role;

ALTER TABLE public.etablissements_champs_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gère la configuration de son établissement"
ON public.etablissements_champs_config
FOR ALL TO authenticated
USING (
  public.is_admin_of_etablissement(auth.uid(), etablissement_id)
)
WITH CHECK (
  public.is_admin_of_etablissement(auth.uid(), etablissement_id)
);

CREATE POLICY "Super admin gère les configurations établissements"
ON public.etablissements_champs_config
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_etablissements_champs_config_updated
BEFORE UPDATE ON public.etablissements_champs_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Champs supplémentaires définis par un établissement.
CREATE TABLE public.etablissements_champs_personnalises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid NOT NULL
    REFERENCES public.etablissements(id) ON DELETE CASCADE,
  nom_champ text NOT NULL,
  type_champ text NOT NULL
    CHECK (type_champ IN ('texte', 'liste_deroulante')),
  options jsonb,
  obligatoire boolean NOT NULL DEFAULT false,
  ordre int NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT etablissements_champs_personnalises_options_array_chk
    CHECK (options IS NULL OR jsonb_typeof(options) = 'array')
);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.etablissements_champs_personnalises TO authenticated;
GRANT ALL ON public.etablissements_champs_personnalises TO service_role;

ALTER TABLE public.etablissements_champs_personnalises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gère ses champs personnalisés"
ON public.etablissements_champs_personnalises
FOR ALL TO authenticated
USING (
  public.is_admin_of_etablissement(auth.uid(), etablissement_id)
)
WITH CHECK (
  public.is_admin_of_etablissement(auth.uid(), etablissement_id)
);

CREATE POLICY "Super admin gère les champs personnalisés"
ON public.etablissements_champs_personnalises
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_etablissements_champs_personnalises_updated
BEFORE UPDATE ON public.etablissements_champs_personnalises
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Valeurs saisies pour les champs personnalisés d'un étudiant.
CREATE TABLE public.etudiants_valeurs_personnalisees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etudiant_id uuid NOT NULL
    REFERENCES public.etudiants_pre_inscrits(id) ON DELETE CASCADE,
  champ_id uuid NOT NULL
    REFERENCES public.etablissements_champs_personnalises(id) ON DELETE CASCADE,
  valeur text NOT NULL,
  UNIQUE (etudiant_id, champ_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.etudiants_valeurs_personnalisees TO authenticated;
GRANT ALL ON public.etudiants_valeurs_personnalisees TO service_role;

ALTER TABLE public.etudiants_valeurs_personnalisees ENABLE ROW LEVEL SECURITY;

-- Le contrôle vérifie à la fois l'établissement de l'étudiant et celui du champ,
-- afin d'empêcher l'association de lignes appartenant à deux établissements.
CREATE POLICY "Admin gère les valeurs de son établissement"
ON public.etudiants_valeurs_personnalisees
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.etudiants_pre_inscrits e
    JOIN public.etablissements_champs_personnalises c
      ON c.id = etudiants_valeurs_personnalisees.champ_id
    WHERE e.id = etudiants_valeurs_personnalisees.etudiant_id
      AND c.etablissement_id = e.etablissement_id
      AND public.is_admin_of_etablissement(auth.uid(), e.etablissement_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.etudiants_pre_inscrits e
    JOIN public.etablissements_champs_personnalises c
      ON c.id = etudiants_valeurs_personnalisees.champ_id
    WHERE e.id = etudiants_valeurs_personnalisees.etudiant_id
      AND c.etablissement_id = e.etablissement_id
      AND public.is_admin_of_etablissement(auth.uid(), e.etablissement_id)
  )
);

CREATE POLICY "Super admin gère toutes les valeurs personnalisées"
ON public.etudiants_valeurs_personnalisees
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));