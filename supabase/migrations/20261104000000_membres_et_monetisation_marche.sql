-- CampusLink : inscription primaire (membres) + monétisation du Marché étudiant
-- (annonces « À la une », bannières publicitaires locales, abonnement Vendeur Pro).
-- Paiement manuel par Orange Money / Moov Money : le super administrateur vérifie puis active.
-- Prérequis : migration 20261103000000_marche_etudiant.sql déjà exécutée (fonction est_super_admin()).
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.

/* ===================== 1. MEMBRES (inscription primaire) ===================== */
-- Totalement séparée des pré-inscriptions universités / étudiants (aucun lien avec user_roles).
CREATE TABLE IF NOT EXISTS public.membres (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_profil text NOT NULL CHECK (length(trim(nom_profil)) BETWEEN 2 AND 60),
  telephone text NOT NULL UNIQUE CHECK (telephone ~ '^[0-9]{8,15}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.membres TO authenticated;
GRANT ALL ON public.membres TO service_role;
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS membres_lecture ON public.membres;
CREATE POLICY membres_lecture ON public.membres FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.est_super_admin());
DROP POLICY IF EXISTS membres_modif ON public.membres;
CREATE POLICY membres_modif ON public.membres FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

/* ===================== 2. TARIFS ET NUMÉROS DE PAIEMENT ===================== */
CREATE TABLE IF NOT EXISTS public.marche_tarifs (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  une_semaine integer NOT NULL DEFAULT 1000 CHECK (une_semaine >= 0),
  une_mois integer NOT NULL DEFAULT 3000 CHECK (une_mois >= 0),
  banniere_semaine integer NOT NULL DEFAULT 5000 CHECK (banniere_semaine >= 0),
  banniere_mois integer NOT NULL DEFAULT 15000 CHECK (banniere_mois >= 0),
  pro_mois integer NOT NULL DEFAULT 5000 CHECK (pro_mois >= 0),
  pro_max_annonces integer NOT NULL DEFAULT 100 CHECK (pro_max_annonces BETWEEN 1 AND 1000),
  numero_orange text NOT NULL DEFAULT '',
  numero_moov text NOT NULL DEFAULT '',
  nom_beneficiaire text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.marche_tarifs (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.marche_tarifs TO anon, authenticated;
GRANT UPDATE ON public.marche_tarifs TO authenticated;
GRANT ALL ON public.marche_tarifs TO service_role;
ALTER TABLE public.marche_tarifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tarifs_lecture ON public.marche_tarifs;
CREATE POLICY tarifs_lecture ON public.marche_tarifs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS tarifs_modif ON public.marche_tarifs;
CREATE POLICY tarifs_modif ON public.marche_tarifs FOR UPDATE TO authenticated
  USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

/* ===================== 3. ANNONCES « À LA UNE » ===================== */
ALTER TABLE public.marche_annonces ADD COLUMN IF NOT EXISTS a_la_une_jusqu timestamptz;
-- Lecture publique de la nouvelle colonne ; aucune écriture directe (seule la validation d'un paiement la remplit).
GRANT SELECT (a_la_une_jusqu) ON public.marche_annonces TO anon;

/* ===================== 4. VENDEURS PRO ===================== */
CREATE TABLE IF NOT EXISTS public.marche_pros (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  actif_jusqu timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marche_pros TO anon, authenticated;
GRANT ALL ON public.marche_pros TO service_role;
ALTER TABLE public.marche_pros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pros_lecture ON public.marche_pros;
CREATE POLICY pros_lecture ON public.marche_pros FOR SELECT TO anon, authenticated USING (true);

-- La limite d'annonces actives passe au forfait Pro pour les vendeurs Pro.
CREATE OR REPLACE FUNCTION public.marche_limite_annonces() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max int := 20;
BEGIN
  IF EXISTS (SELECT 1 FROM public.marche_pros WHERE user_id = NEW.user_id AND actif_jusqu > now()) THEN
    SELECT pro_max_annonces INTO v_max FROM public.marche_tarifs WHERE id = 1;
  END IF;
  IF (SELECT count(*) FROM public.marche_annonces WHERE user_id = NEW.user_id AND statut = 'active') >= v_max THEN
    RAISE EXCEPTION 'Limite d''annonces actives atteinte' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

/* ===================== 5. BANNIÈRES PUBLICITAIRES ===================== */
CREATE TABLE IF NOT EXISTS public.marche_bannieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonceur text NOT NULL CHECK (length(trim(annonceur)) BETWEEN 2 AND 80),
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 2 AND 160),
  telephone text CHECK (telephone IS NULL OR telephone ~ '^[0-9+ ().-]{6,30}$'),
  lien text CHECK (lien IS NULL OR lien ~ '^https?://'),
  image_path text,
  debut date NOT NULL DEFAULT current_date,
  fin date NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fin >= debut)
);
GRANT SELECT ON public.marche_bannieres TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marche_bannieres TO authenticated;
GRANT ALL ON public.marche_bannieres TO service_role;
ALTER TABLE public.marche_bannieres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bannieres_lecture ON public.marche_bannieres;
CREATE POLICY bannieres_lecture ON public.marche_bannieres FOR SELECT TO anon, authenticated
  USING ((actif AND current_date BETWEEN debut AND fin) OR public.est_super_admin());
DROP POLICY IF EXISTS bannieres_gestion ON public.marche_bannieres;
CREATE POLICY bannieres_gestion ON public.marche_bannieres FOR ALL TO authenticated
  USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marche-bannieres', 'marche-bannieres', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS bannieres_img_ajout ON storage.objects;
CREATE POLICY bannieres_img_ajout ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marche-bannieres' AND public.est_super_admin());
DROP POLICY IF EXISTS bannieres_img_suppr ON storage.objects;
CREATE POLICY bannieres_img_suppr ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marche-bannieres' AND public.est_super_admin());

/* ===================== 6. DEMANDES DE PAIEMENT ===================== */
CREATE TABLE IF NOT EXISTS public.marche_paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type_offre text NOT NULL CHECK (type_offre IN ('une', 'pro')),
  duree text NOT NULL CHECK (duree IN ('semaine', 'mois')),
  annonce_id uuid REFERENCES public.marche_annonces(id) ON DELETE CASCADE,
  montant integer NOT NULL CHECK (montant >= 0),
  operateur text NOT NULL CHECK (operateur IN ('orange', 'moov')),
  telephone_payeur text NOT NULL CHECK (telephone_payeur ~ '^[0-9+ ().-]{6,30}$'),
  reference text NOT NULL CHECK (length(trim(reference)) BETWEEN 3 AND 80),
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  traite_le timestamptz,
  CHECK (type_offre <> 'une' OR annonce_id IS NOT NULL)
);
GRANT SELECT, INSERT ON public.marche_paiements TO authenticated;
GRANT ALL ON public.marche_paiements TO service_role;
ALTER TABLE public.marche_paiements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS paiements_lecture ON public.marche_paiements;
CREATE POLICY paiements_lecture ON public.marche_paiements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.est_super_admin());
DROP POLICY IF EXISTS paiements_creation ON public.marche_paiements;
CREATE POLICY paiements_creation ON public.marche_paiements FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND statut = 'en_attente'
    AND (annonce_id IS NULL OR EXISTS (SELECT 1 FROM public.marche_annonces a WHERE a.id = annonce_id AND a.user_id = auth.uid()))
  );

-- Le montant est toujours recalculé à partir des tarifs (impossible de déclarer un faux prix).
CREATE OR REPLACE FUNCTION public.marche_paiement_montant() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.marche_tarifs;
BEGIN
  SELECT * INTO t FROM public.marche_tarifs WHERE id = 1;
  NEW.montant := CASE
    WHEN NEW.type_offre = 'une' AND NEW.duree = 'semaine' THEN t.une_semaine
    WHEN NEW.type_offre = 'une' THEN t.une_mois
    ELSE t.pro_mois END;
  IF NEW.type_offre = 'pro' THEN NEW.duree := 'mois'; NEW.annonce_id := NULL; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS marche_paiements_montant ON public.marche_paiements;
CREATE TRIGGER marche_paiements_montant BEFORE INSERT ON public.marche_paiements
  FOR EACH ROW EXECUTE FUNCTION public.marche_paiement_montant();

-- Validation / refus par le super administrateur : active automatiquement l'offre payée.
CREATE OR REPLACE FUNCTION public.marche_traiter_paiement(p_id uuid, p_valider boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.marche_paiements; v_int interval;
BEGIN
  IF NOT public.est_super_admin() THEN
    RAISE EXCEPTION 'Action réservée au super administrateur' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO p FROM public.marche_paiements WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR p.statut <> 'en_attente' THEN RETURN; END IF;
  UPDATE public.marche_paiements SET statut = CASE WHEN p_valider THEN 'validee' ELSE 'refusee' END, traite_le = now() WHERE id = p_id;
  IF NOT p_valider THEN RETURN; END IF;
  v_int := CASE WHEN p.duree = 'semaine' THEN interval '7 days' ELSE interval '30 days' END;
  IF p.type_offre = 'une' THEN
    UPDATE public.marche_annonces
      SET a_la_une_jusqu = greatest(coalesce(a_la_une_jusqu, now()), now()) + v_int
      WHERE id = p.annonce_id;
  ELSE
    INSERT INTO public.marche_pros (user_id, actif_jusqu) VALUES (p.user_id, now() + v_int)
    ON CONFLICT (user_id) DO UPDATE
      SET actif_jusqu = greatest(public.marche_pros.actif_jusqu, now()) + v_int, updated_at = now();
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.marche_traiter_paiement(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marche_traiter_paiement(uuid, boolean) TO authenticated, service_role;
