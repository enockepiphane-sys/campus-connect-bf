-- CampusLink : système de PARRAINAGE et de RÉCOMPENSES (téléchargements).
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor > New query > Run (peut être relancé sans risque).
--
-- Règles :
--   * 3 inscriptions validées  -> 1 téléchargement
--   * 5 inscriptions validées  -> +3 téléchargements (4 au total)
--   * 10 inscriptions validées -> +6 téléchargements (10 au total) + badge « Ambassadeur CampusLink »
--   * 20 inscriptions validées -> « Super Ambassadeur CampusLink » : téléchargements illimités
--   * Re-télécharger un fichier déjà téléchargé ne consomme pas de crédit.
--   * La CONSULTATION en ligne n'est jamais bloquée : seuls les téléchargements sont comptés.
-- Anti-fraude :
--   * un filleul ne peut être parrainé qu'une seule fois (UNIQUE filleul_id) ;
--   * auto-parrainage interdit (même compte, même appareil que le parrain, même email de récupération) ;
--   * un même appareil ne peut valider qu'une seule inscription parrainée ;
--   * une inscription n'est VALIDÉE que si le filleul revient sur CampusLink au moins 24 h après son inscription.

-- 1) Tables -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parrainage_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{6,12}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.parrainage_codes TO authenticated;
GRANT ALL ON public.parrainage_codes TO service_role;
ALTER TABLE public.parrainage_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parrainage_codes_lecture ON public.parrainage_codes;
CREATE POLICY parrainage_codes_lecture ON public.parrainage_codes FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.parrainage_appareils (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appareil text NOT NULL CHECK (length(appareil) BETWEEN 8 AND 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, appareil)
);
CREATE INDEX IF NOT EXISTS parrainage_appareils_appareil_idx ON public.parrainage_appareils (appareil);
GRANT ALL ON public.parrainage_appareils TO service_role;
ALTER TABLE public.parrainage_appareils ENABLE ROW LEVEL SECURITY;
-- Aucune politique : table accessible uniquement via les fonctions sécurisées ci-dessous.

CREATE TABLE IF NOT EXISTS public.parrainages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parrain_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filleul_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
  motif text,
  appareil text,
  created_at timestamptz NOT NULL DEFAULT now(),
  valide_at timestamptz,
  CHECK (parrain_id <> filleul_id)
);
CREATE INDEX IF NOT EXISTS parrainages_parrain_idx ON public.parrainages (parrain_id, statut);
CREATE INDEX IF NOT EXISTS parrainages_appareil_idx ON public.parrainages (appareil);
GRANT SELECT ON public.parrainages TO authenticated;
GRANT ALL ON public.parrainages TO service_role;
ALTER TABLE public.parrainages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS parrainages_lecture ON public.parrainages;
CREATE POLICY parrainages_lecture ON public.parrainages FOR SELECT TO authenticated USING (parrain_id = auth.uid());
DROP POLICY IF EXISTS parrainages_lecture_super_admin ON public.parrainages;
CREATE POLICY parrainages_lecture_super_admin ON public.parrainages FOR SELECT TO authenticated USING (public.est_super_admin());

CREATE TABLE IF NOT EXISTS public.telechargements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ressource text NOT NULL CHECK (length(ressource) BETWEEN 3 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ressource)
);
GRANT SELECT ON public.telechargements TO authenticated;
GRANT ALL ON public.telechargements TO service_role;
ALTER TABLE public.telechargements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS telechargements_lecture ON public.telechargements;
CREATE POLICY telechargements_lecture ON public.telechargements FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 2) Barème des récompenses (modifiable ici uniquement) ---------------------------
CREATE OR REPLACE FUNCTION public.parrainage_credits(_valides int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN _valides >= 10 THEN 10 WHEN _valides >= 5 THEN 4 WHEN _valides >= 3 THEN 1 ELSE 0 END;
$$;

-- 3) Enregistrement automatique du parrainage à l'inscription --------------------
CREATE OR REPLACE FUNCTION public.parrainage_enregistrer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_code text;
  v_app text;
  v_parrain uuid;
  v_statut text := 'en_attente';
  v_motif text;
  v_email_f text;
  v_email_p text;
BEGIN
  BEGIN
    v_app := nullif(left(trim(COALESCE(NEW.raw_user_meta_data->>'appareil', '')), 64), '');
    IF v_app IS NOT NULL AND length(v_app) >= 8 THEN
      INSERT INTO public.parrainage_appareils (user_id, appareil) VALUES (NEW.id, v_app) ON CONFLICT DO NOTHING;
    ELSE
      v_app := NULL;
    END IF;

    v_code := upper(trim(COALESCE(NEW.raw_user_meta_data->>'parrain_code', '')));
    IF v_code = '' THEN RETURN NEW; END IF;
    SELECT user_id INTO v_parrain FROM public.parrainage_codes WHERE code = v_code;
    IF v_parrain IS NULL OR v_parrain = NEW.id THEN RETURN NEW; END IF;

    v_email_f := lower(nullif(trim(COALESCE(NEW.raw_user_meta_data->>'email_recuperation', '')), ''));
    SELECT lower(nullif(trim(COALESCE(raw_user_meta_data->>'email_recuperation', '')), '')) INTO v_email_p FROM auth.users WHERE id = v_parrain;

    IF v_app IS NOT NULL AND EXISTS (SELECT 1 FROM public.parrainage_appareils WHERE user_id = v_parrain AND appareil = v_app) THEN
      v_statut := 'rejete'; v_motif := 'Inscription faite depuis l''appareil du parrain (auto-inscription).';
    ELSIF v_app IS NOT NULL AND EXISTS (SELECT 1 FROM public.parrainages WHERE appareil = v_app) THEN
      v_statut := 'rejete'; v_motif := 'Appareil déjà utilisé pour une autre inscription parrainée.';
    ELSIF v_email_f IS NOT NULL AND v_email_f = v_email_p THEN
      v_statut := 'rejete'; v_motif := 'Même email que le parrain (auto-inscription).';
    END IF;

    INSERT INTO public.parrainages (parrain_id, filleul_id, statut, motif, appareil)
    VALUES (v_parrain, NEW.id, v_statut, v_motif, v_app)
    ON CONFLICT (filleul_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- ne bloque jamais l'inscription
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS parrainage_enregistrer_trg ON auth.users;
CREATE TRIGGER parrainage_enregistrer_trg
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.parrainage_enregistrer();

-- 4) Activité du filleul : validation après 24 h ---------------------------------
CREATE OR REPLACE FUNCTION public.parrainage_signaler_activite(_appareil text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_app text := nullif(left(trim(COALESCE(_appareil, '')), 64), '');
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF v_app IS NOT NULL AND length(v_app) >= 8
     AND (SELECT count(*) FROM public.parrainage_appareils WHERE user_id = v_uid) < 10 THEN
    INSERT INTO public.parrainage_appareils (user_id, appareil) VALUES (v_uid, v_app) ON CONFLICT DO NOTHING;
  ELSE
    v_app := NULL;
  END IF;

  -- Le filleul utilise l'appareil de son parrain : auto-inscription.
  IF v_app IS NOT NULL THEN
    UPDATE public.parrainages p SET statut = 'rejete', motif = 'Compte utilisé depuis l''appareil du parrain (auto-inscription).'
    WHERE p.filleul_id = v_uid AND p.statut = 'en_attente'
      AND EXISTS (SELECT 1 FROM public.parrainage_appareils a WHERE a.user_id = p.parrain_id AND a.appareil = v_app);
  END IF;

  UPDATE public.parrainages p SET statut = 'valide', valide_at = now()
  WHERE p.filleul_id = v_uid AND p.statut = 'en_attente'
    AND p.created_at <= now() - interval '24 hours'
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v_uid AND u.email_confirmed_at IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.parrainage_signaler_activite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.parrainage_signaler_activite(text) TO authenticated;

-- 5) Mon tableau de bord de parrainage ------------------------------------------
CREATE OR REPLACE FUNCTION public.mon_parrainage()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
  v_valides int; v_attente int; v_rejetes int; v_utilises int; v_credits int;
  v_exempt boolean := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501'; END IF;
  SELECT code INTO v_code FROM public.parrainage_codes WHERE user_id = v_uid;
  WHILE v_code IS NULL LOOP
    BEGIN
      v_code := upper(substr(translate(md5(random()::text || clock_timestamp()::text || v_uid::text), '01', ''), 1, 8));
      IF length(v_code) < 8 THEN v_code := NULL; CONTINUE; END IF;
      INSERT INTO public.parrainage_codes (user_id, code) VALUES (v_uid, v_code);
    EXCEPTION WHEN unique_violation THEN
      SELECT code INTO v_code FROM public.parrainage_codes WHERE user_id = v_uid;
    END;
  END LOOP;

  SELECT count(*) FILTER (WHERE statut = 'valide'), count(*) FILTER (WHERE statut = 'en_attente'), count(*) FILTER (WHERE statut = 'rejete')
    INTO v_valides, v_attente, v_rejetes FROM public.parrainages WHERE parrain_id = v_uid;
  SELECT count(*) INTO v_utilises FROM public.telechargements WHERE user_id = v_uid;
  v_credits := public.parrainage_credits(v_valides);
  BEGIN v_exempt := public.est_super_admin(); EXCEPTION WHEN OTHERS THEN v_exempt := false; END;
  IF v_valides >= 20 THEN v_exempt := true; END IF; -- Super Ambassadeur

  RETURN json_build_object(
    'code', v_code, 'valides', v_valides, 'en_attente', v_attente, 'rejetes', v_rejetes,
    'credits', v_credits, 'utilises', v_utilises, 'restants', GREATEST(v_credits - v_utilises, 0),
    'ambassadeur', v_valides >= 10, 'super_ambassadeur', v_valides >= 20, 'illimite', v_exempt
  );
END $$;
REVOKE ALL ON FUNCTION public.mon_parrainage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_parrainage() TO authenticated;

-- 6) Consommer un téléchargement (appelé avant chaque téléchargement) ------------
CREATE OR REPLACE FUNCTION public.consommer_telechargement(_ressource text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_res text := left(trim(COALESCE(_ressource, '')), 200);
  v_valides int; v_utilises int; v_credits int;
  v_exempt boolean := false;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('ok', false, 'raison', 'connexion'); END IF;
  IF length(v_res) < 3 THEN RETURN json_build_object('ok', false, 'raison', 'ressource'); END IF;
  BEGIN v_exempt := public.est_super_admin(); EXCEPTION WHEN OTHERS THEN v_exempt := false; END;
  IF v_exempt THEN RETURN json_build_object('ok', true, 'illimite', true); END IF;

  PERFORM pg_advisory_xact_lock(hashtext('telechargement:' || v_uid::text));
  IF EXISTS (SELECT 1 FROM public.telechargements WHERE user_id = v_uid AND ressource = v_res) THEN
    RETURN json_build_object('ok', true, 'deja', true);
  END IF;

  SELECT count(*) INTO v_valides FROM public.parrainages WHERE parrain_id = v_uid AND statut = 'valide';
  IF v_valides >= 20 THEN -- Super Ambassadeur : illimité
    INSERT INTO public.telechargements (user_id, ressource) VALUES (v_uid, v_res);
    RETURN json_build_object('ok', true, 'illimite', true);
  END IF;
  SELECT count(*) INTO v_utilises FROM public.telechargements WHERE user_id = v_uid;
  v_credits := public.parrainage_credits(v_valides);
  IF v_utilises >= v_credits THEN
    RETURN json_build_object('ok', false, 'raison', 'quota', 'valides', v_valides, 'restants', 0);
  END IF;

  INSERT INTO public.telechargements (user_id, ressource) VALUES (v_uid, v_res);
  RETURN json_build_object('ok', true, 'restants', v_credits - v_utilises - 1);
END $$;
REVOKE ALL ON FUNCTION public.consommer_telechargement(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consommer_telechargement(text) TO authenticated;

-- 7) Classement des meilleurs parrains -------------------------------------------
DROP FUNCTION IF EXISTS public.classement_parrains(int);
CREATE FUNCTION public.classement_parrains(_limite int DEFAULT 20)
RETURNS TABLE (rang int, nom text, valides int, ambassadeur boolean, super_ambassadeur boolean, moi boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  WITH t AS (
    SELECT p.parrain_id, count(*)::int AS n, max(p.valide_at) AS dernier
    FROM public.parrainages p WHERE p.statut = 'valide'
    GROUP BY p.parrain_id
  )
  SELECT (row_number() OVER (ORDER BY t.n DESC, t.dernier ASC))::int,
         COALESCE(m.nom_profil, nullif(u.raw_user_meta_data->>'nom_complet', ''), 'Membre CampusLink'),
         t.n, t.n >= 10, t.n >= 20, t.parrain_id = auth.uid()
  FROM t
  LEFT JOIN public.membres m ON m.user_id = t.parrain_id
  LEFT JOIN auth.users u ON u.id = t.parrain_id
  ORDER BY t.n DESC, t.dernier ASC
  LIMIT LEAST(GREATEST(COALESCE(_limite, 20), 1), 100);
$$;
REVOKE ALL ON FUNCTION public.classement_parrains(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.classement_parrains(int) TO authenticated;
