-- =========================================================================
-- Tables manquantes du dépôt de migrations, recréées fidèlement à partir de
-- la structure et des policies RLS réellement en place dans la base
-- Supabase (vérifiées via information_schema.columns, table_constraints
-- et pg_policies). Toutes les instructions sont idempotentes
-- (IF NOT EXISTS / DROP POLICY IF EXISTS) pour pouvoir être exécutées sans
-- risque même si une partie existe déjà.
-- =========================================================================

-- ============ audit_logs ============
-- Historique d'audit des actions administrateur (par établissement).
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  admin_email text,
  etablissement_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  description text,
  ancienne_valeur jsonb,
  nouvelle_valeur jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_logs;
CREATE POLICY "audit_admin_select" ON public.audit_logs
FOR SELECT TO public
USING (etablissement_id IS NOT NULL AND public.is_admin_of_etablissement(auth.uid(), etablissement_id));

DROP POLICY IF EXISTS "audit_super_admin_select" ON public.audit_logs;
CREATE POLICY "audit_super_admin_select" ON public.audit_logs
FOR SELECT TO public
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_no_update_delete" ON public.audit_logs;
CREATE POLICY "audit_no_update_delete" ON public.audit_logs
FOR ALL TO public
USING (false)
WITH CHECK (false);


-- ============ etablissement_champs_optionnels ============
-- Configuration par établissement : matricule/téléphone activés ou non.
CREATE TABLE IF NOT EXISTS public.etablissement_champs_optionnels (
  etablissement_id uuid PRIMARY KEY REFERENCES public.etablissements(id),
  utilise_matricule boolean NOT NULL DEFAULT false,
  utilise_telephone boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.etablissement_champs_optionnels ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_etab_champs_optionnels_updated ON public.etablissement_champs_optionnels;
CREATE TRIGGER trg_etab_champs_optionnels_updated
BEFORE UPDATE ON public.etablissement_champs_optionnels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admin lit config établissement" ON public.etablissement_champs_optionnels;
CREATE POLICY "Admin lit config établissement" ON public.etablissement_champs_optionnels
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])
    AND ur.etablissement_id = etablissement_champs_optionnels.etablissement_id
));

DROP POLICY IF EXISTS "Admin gère config établissement" ON public.etablissement_champs_optionnels;
CREATE POLICY "Admin gère config établissement" ON public.etablissement_champs_optionnels
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])
    AND ur.etablissement_id = etablissement_champs_optionnels.etablissement_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])
    AND ur.etablissement_id = etablissement_champs_optionnels.etablissement_id
));


-- ============ historique_actions ============
-- Journal des actions du super-admin (établissements, événements sociaux, etc.).
CREATE TABLE IF NOT EXISTS public.historique_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id uuid,
  super_admin_email text,
  action text NOT NULL,
  cible_type text NOT NULL,
  cible_id uuid,
  cible_nom text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.historique_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admins_can_read_historique" ON public.historique_actions;
CREATE POLICY "super_admins_can_read_historique" ON public.historique_actions
FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "super_admins_can_insert_historique" ON public.historique_actions;
CREATE POLICY "super_admins_can_insert_historique" ON public.historique_actions
FOR INSERT TO public
WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));


-- ============ notifications ============
-- Notifications personnelles d'un utilisateur (étudiant ou admin).
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL,
  titre text NOT NULL,
  corps text,
  lien text,
  reference_id uuid,
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
FOR DELETE TO public
USING (auth.uid() = user_id);


-- ============ push_subscriptions ============
-- Abonnements aux notifications push (navigateur) d'un utilisateur.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_push_subscriptions_updated ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_updated
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
FOR SELECT TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_update_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_update_own" ON public.push_subscriptions
FOR UPDATE TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_subscriptions_delete_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
FOR DELETE TO public
USING (auth.uid() = user_id);


-- ============ unites_enseignement ============
-- Unités d'enseignement (UE) rattachées à un niveau.
CREATE TABLE IF NOT EXISTS public.unites_enseignement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niveau_id uuid NOT NULL REFERENCES public.niveaux(id),
  code text,
  nom text NOT NULL,
  ordre integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.unites_enseignement ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_unites_enseignement_updated ON public.unites_enseignement;
CREATE TRIGGER trg_unites_enseignement_updated
BEFORE UPDATE ON public.unites_enseignement
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "ue_select_etablissement" ON public.unites_enseignement;
CREATE POLICY "ue_select_etablissement" ON public.unites_enseignement
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "ue_admin_all" ON public.unites_enseignement;
CREATE POLICY "ue_admin_all" ON public.unites_enseignement
FOR ALL TO public
USING (EXISTS (
  SELECT 1
  FROM public.niveaux n
  JOIN public.filieres f ON f.id = n.filiere_id
  JOIN public.user_roles ur ON ur.etablissement_id = f.etablissement_id
  WHERE n.id = unites_enseignement.niveau_id
    AND ur.user_id = auth.uid()
    AND ur.role = ANY (ARRAY['admin'::public.app_role, 'super_admin'::public.app_role])
));

-- ⚠️ Remarque : la policy "ue_select_etablissement" a qual = true, c'est-à-dire
-- que TOUTE personne connectée OU anonyme (rôle "public" inclut anon) peut lire
-- toutes les unités d'enseignement de tous les établissements sans restriction.
-- C'est exactement ce qui est en place dans votre base actuelle (reproduit
-- fidèlement ici), mais si ce n'est pas voulu, il faudra la resserrer, par
-- exemple en la limitant aux utilisateurs authentifiés du même établissement.
