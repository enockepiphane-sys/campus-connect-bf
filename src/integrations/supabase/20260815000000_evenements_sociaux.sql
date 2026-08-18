-- =========================================
-- ÉVÉNEMENTS SOCIAUX (page d'accueil publique)
-- Distinct de public.evenements (interne, lié à un niveau/établissement).
-- Géré uniquement par le super admin, affiché publiquement sur l'accueil.
--
-- Cette migration recrée une table déjà utilisée par le code applicatif
-- (src/routes/_authenticated/super-admin.tsx, src/routes/index.tsx) mais
-- absente du dossier supabase/migrations du dépôt fourni. Si la table
-- existe déjà réellement dans votre projet Supabase, ce script est
-- idempotent (IF NOT EXISTS / ON CONFLICT) et ne fera rien de destructif —
-- mais vérifiez d'abord dans le Table Editor Supabase pour éviter les
-- doublons de policies (voir remarque en bas de fichier).
-- =========================================
CREATE TABLE IF NOT EXISTS public.evenements_sociaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  affiche_url text,
  lien text,
  date_evenement timestamptz,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.evenements_sociaux TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evenements_sociaux TO authenticated;
GRANT ALL ON public.evenements_sociaux TO service_role;
ALTER TABLE public.evenements_sociaux ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_evenements_sociaux_updated
BEFORE UPDATE ON public.evenements_sociaux
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lecture publique des événements actifs uniquement (visiteurs anonymes inclus)
CREATE POLICY "Lecture publique evenements sociaux actifs" ON public.evenements_sociaux
FOR SELECT TO anon, authenticated
USING (actif = true);

-- Le super admin voit et gère tout (y compris inactifs)
CREATE POLICY "Super admin gere evenements sociaux" ON public.evenements_sociaux
FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- =========================================
-- BUCKET STORAGE PUBLIC (affiches visibles sans authentification)
-- =========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('affiches-evenements-sociaux', 'affiches-evenements-sociaux', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Affiches sociales lisibles par tous"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'affiches-evenements-sociaux');

CREATE POLICY "Super admin ajoute affiches sociales"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'affiches-evenements-sociaux' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin modifie affiches sociales"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'affiches-evenements-sociaux' AND public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin supprime affiches sociales"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'affiches-evenements-sociaux' AND public.is_super_admin(auth.uid()));

-- ⚠️ IMPORTANT avant d'exécuter ce script :
-- Si la table public.evenements_sociaux existe déjà réellement dans votre
-- base (ce qui est probable, puisque le code l'utilise), les instructions
-- CREATE POLICY et CREATE TRIGGER ci-dessus échoueront avec une erreur
-- "already exists" si elles ont déjà été appliquées manuellement.
-- Dans ce cas : ouvrez Supabase > SQL Editor, exécutez uniquement les
-- sections encore manquantes, ou passez chaque instruction en
-- "CREATE POLICY IF NOT EXISTS" / DROP POLICY IF EXISTS avant recréation.
