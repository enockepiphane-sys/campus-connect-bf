-- CampusLink — Avis (notes + commentaires) sur la plateforme + notifications envoyées par le super admin
-- À EXÉCUTER UNE FOIS dans Supabase (SQL Editor -> New query -> Run). Peut être relancé sans risque.
-- Prérequis : public.est_super_admin() existe déjà (migrations précédentes) et la table public.membres.
BEGIN;

/* ===================== 1. AVIS SUR LA PLATEFORME ===================== */
-- Un seul avis par compte (modifiable). Le nom affiché est copié au moment de l'envoi.
CREATE TABLE IF NOT EXISTS public.avis_plateforme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_affiche text NOT NULL DEFAULT 'Membre' CHECK (length(trim(nom_affiche)) BETWEEN 1 AND 80),
  note smallint NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire text CHECK (commentaire IS NULL OR length(commentaire) <= 1000),
  reponse text CHECK (reponse IS NULL OR length(reponse) <= 1000),
  reponse_le timestamptz,
  reponse_lue boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.avis_plateforme TO authenticated;
GRANT DELETE ON public.avis_plateforme TO authenticated;
GRANT ALL ON public.avis_plateforme TO service_role;
ALTER TABLE public.avis_plateforme ENABLE ROW LEVEL SECURITY;

-- Chacun voit son propre avis ; le super admin voit tout.
DROP POLICY IF EXISTS avis_lecture ON public.avis_plateforme;
CREATE POLICY avis_lecture ON public.avis_plateforme FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.est_super_admin());

-- Seuls les comptes inscrits (table membres) peuvent noter, et seulement pour eux-mêmes, sans réponse pré-remplie.
DROP POLICY IF EXISTS avis_envoi ON public.avis_plateforme;
CREATE POLICY avis_envoi ON public.avis_plateforme FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND reponse IS NULL AND EXISTS (SELECT 1 FROM public.membres m WHERE m.user_id = auth.uid()));

-- Modification : l'auteur modifie son avis ; le super admin modifie tout (pour répondre).
DROP POLICY IF EXISTS avis_modif_auteur ON public.avis_plateforme;
CREATE POLICY avis_modif_auteur ON public.avis_plateforme FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS avis_modif_admin ON public.avis_plateforme;
CREATE POLICY avis_modif_admin ON public.avis_plateforme FOR UPDATE TO authenticated
  USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

DROP POLICY IF EXISTS avis_suppression ON public.avis_plateforme;
CREATE POLICY avis_suppression ON public.avis_plateforme FOR DELETE TO authenticated
  USING (public.est_super_admin());

-- Empêche un membre de s'attribuer lui-même une réponse du super admin en modifiant son avis.
CREATE OR REPLACE FUNCTION public.avis_protege_reponse()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NOT public.est_super_admin() THEN
    NEW.reponse := OLD.reponse;
    NEW.reponse_le := OLD.reponse_le;
    NEW.user_id := OLD.user_id;
    -- seule la lecture de la réponse peut être marquée par l'auteur
  ELSIF NEW.reponse IS DISTINCT FROM OLD.reponse THEN
    NEW.reponse_le := CASE WHEN NEW.reponse IS NULL THEN NULL ELSE now() END;
    NEW.reponse_lue := false;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_avis_protege_reponse ON public.avis_plateforme;
CREATE TRIGGER trg_avis_protege_reponse BEFORE UPDATE ON public.avis_plateforme
  FOR EACH ROW EXECUTE FUNCTION public.avis_protege_reponse();

-- Moyenne et nombre d'avis, lisibles par tout le monde (sans exposer les commentaires).
CREATE OR REPLACE FUNCTION public.avis_statistiques()
RETURNS TABLE (moyenne numeric, total bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(round(avg(note)::numeric, 1), 0), count(*) FROM public.avis_plateforme;
$$;
GRANT EXECUTE ON FUNCTION public.avis_statistiques() TO anon, authenticated;

/* ===================== 2. NOTIFICATIONS DE LA PLATEFORME ===================== */
-- Messages envoyés par le super admin à tous les comptes inscrits.
CREATE TABLE IF NOT EXISTS public.notifications_plateforme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 2 AND 120),
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 2 AND 500),
  lien text CHECK (lien IS NULL OR length(lien) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications_plateforme TO authenticated;
GRANT INSERT, DELETE ON public.notifications_plateforme TO authenticated;
GRANT ALL ON public.notifications_plateforme TO service_role;
ALTER TABLE public.notifications_plateforme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifpf_lecture ON public.notifications_plateforme;
CREATE POLICY notifpf_lecture ON public.notifications_plateforme FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS notifpf_gestion ON public.notifications_plateforme;
CREATE POLICY notifpf_gestion ON public.notifications_plateforme FOR ALL TO authenticated
  USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

-- Suivi « lu » par utilisateur.
CREATE TABLE IF NOT EXISTS public.notifications_plateforme_lues (
  notification_id uuid NOT NULL REFERENCES public.notifications_plateforme(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lu_le timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);
GRANT SELECT, INSERT ON public.notifications_plateforme_lues TO authenticated;
GRANT ALL ON public.notifications_plateforme_lues TO service_role;
ALTER TABLE public.notifications_plateforme_lues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifpf_lues_lecture ON public.notifications_plateforme_lues;
CREATE POLICY notifpf_lues_lecture ON public.notifications_plateforme_lues FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS notifpf_lues_ecriture ON public.notifications_plateforme_lues;
CREATE POLICY notifpf_lues_ecriture ON public.notifications_plateforme_lues FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Nombre d'appareils abonnés aux notifications push (visible du super admin uniquement).
CREATE OR REPLACE FUNCTION public.push_abonnes_compte()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.est_super_admin() THEN (SELECT count(*) FROM public.push_subscriptions) ELSE 0 END;
$$;
GRANT EXECUTE ON FUNCTION public.push_abonnes_compte() TO authenticated;

COMMIT;
