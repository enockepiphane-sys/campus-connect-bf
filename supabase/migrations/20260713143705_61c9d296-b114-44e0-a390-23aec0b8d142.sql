
-- ============ ENUM des rôles ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'etudiant');

-- ============ Table etablissements ============
CREATE TABLE public.etablissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL UNIQUE,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.etablissements TO authenticated;
GRANT ALL ON public.etablissements TO service_role;

ALTER TABLE public.etablissements ENABLE ROW LEVEL SECURITY;

-- ============ Table user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  etablissement_id UUID REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, etablissement_id)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ Fonction has_role (SECURITY DEFINER, évite la récursion RLS) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin'::public.app_role)
$$;

-- ============ Policies user_roles ============
CREATE POLICY "Chacun voit ses propres rôles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins voient tous les rôles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins gèrent tous les rôles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ Policies etablissements ============
CREATE POLICY "Admins et super admins voient tous les établissements"
ON public.etablissements FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Super admins gèrent les établissements"
ON public.etablissements FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ Vue publique : nom + statut uniquement ============
CREATE OR REPLACE VIEW public.etablissements_public
WITH (security_invoker = true) AS
SELECT id, nom, statut
FROM public.etablissements
WHERE statut = 'actif';

GRANT SELECT ON public.etablissements_public TO anon, authenticated;

-- Politique dédiée : SELECT anon sur les rangées actives (colonnes limitées via la vue)
CREATE POLICY "Lecture publique des établissements actifs"
ON public.etablissements FOR SELECT TO anon
USING (statut = 'actif');
-- NOTE : anon n'a pas de GRANT SELECT sur la table, seulement sur la vue.
-- La policy est là au cas où on grante ultérieurement des colonnes précises.

-- ============ Table super_admins ============
CREATE TABLE public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.super_admins TO authenticated;
GRANT ALL ON public.super_admins TO service_role;

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins voient la liste"
ON public.super_admins FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

-- ============ Table admins_pre_autorises ============
CREATE TABLE public.admins_pre_autorises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  email TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  inscrit BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (etablissement_id, email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins_pre_autorises TO authenticated;
GRANT ALL ON public.admins_pre_autorises TO service_role;

ALTER TABLE public.admins_pre_autorises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins gèrent les pré-autorisations"
ON public.admins_pre_autorises FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "L'admin voit sa propre pré-autorisation"
ON public.admins_pre_autorises FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============ Fonction RPC : vérifier une pré-autorisation (usage anon lors de l'inscription) ============
-- Renvoie l'id de la pré-autorisation si nom + email + date naissance + établissement correspondent
-- et que l'admin n'est pas déjà inscrit. Sinon renvoie NULL. Aucune donnée sensible n'est exposée.
CREATE OR REPLACE FUNCTION public.verifier_admin_pre_autorise(
  _etablissement_id UUID,
  _nom_complet TEXT,
  _email TEXT,
  _date_naissance DATE
)
RETURNS TABLE(pre_autorisation_id UUID, deja_inscrit BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.inscrit
  FROM public.admins_pre_autorises a
  WHERE a.etablissement_id = _etablissement_id
    AND lower(trim(a.email)) = lower(trim(_email))
    AND lower(trim(a.nom_complet)) = lower(trim(_nom_complet))
    AND a.date_naissance = _date_naissance
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verifier_admin_pre_autorise TO anon, authenticated;

-- ============ Table demandes_partenariat ============
CREATE TABLE public.demandes_partenariat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_etablissement TEXT NOT NULL,
  nom_contact TEXT NOT NULL,
  email_contact TEXT NOT NULL,
  telephone_contact TEXT,
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'accepte', 'refuse')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.demandes_partenariat TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.demandes_partenariat TO authenticated;
GRANT ALL ON public.demandes_partenariat TO service_role;

ALTER TABLE public.demandes_partenariat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut soumettre une demande"
ON public.demandes_partenariat FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Super admins voient les demandes"
ON public.demandes_partenariat FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins mettent à jour les demandes"
ON public.demandes_partenariat FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- ============ Trigger updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_etablissements_updated
BEFORE UPDATE ON public.etablissements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
