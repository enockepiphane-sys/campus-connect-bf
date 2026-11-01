-- CampusLink — SQL n°3 À EXÉCUTER DANS SUPABASE (SQL Editor -> New query -> Run)
-- 1) Cours en ligne (classés par filière, niveau et module)
-- 2) Guide des nouveaux bacheliers (Campus Faso, orientation, inscription…)
-- Prérequis : le SQL n°2 (bibliotheque_visites) a déjà été exécuté (fonction est_super_admin).
-- Peut être relancé sans risque.
BEGIN;

/* ===================== COURS EN LIGNE ===================== */
CREATE TABLE IF NOT EXISTS public.cours_en_ligne (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filiere text NOT NULL CHECK (length(trim(filiere)) BETWEEN 1 AND 100),
  niveau text NOT NULL CHECK (niveau IN ('L1','L2','L3','M1','M2','Doctorat','BTS 1','BTS 2','Autre')),
  module text NOT NULL CHECK (length(trim(module)) BETWEEN 1 AND 150),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 2000),
  enseignant text CHECK (enseignant IS NULL OR length(enseignant) <= 150),
  type_contenu text NOT NULL CHECK (type_contenu IN ('video','photo','manuscrit','pdf')),
  fichier_path text,
  fichier_type text,
  taille bigint,
  video_url text CHECK (video_url IS NULL OR video_url ~* '^https?://'),
  actif boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fichier_path IS NOT NULL OR video_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS cours_en_ligne_classement_idx ON public.cours_en_ligne (filiere, niveau, module);
CREATE INDEX IF NOT EXISTS cours_en_ligne_date_idx ON public.cours_en_ligne (created_at DESC);

CREATE OR REPLACE FUNCTION public.cours_update_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS cours_en_ligne_updated ON public.cours_en_ligne;
CREATE TRIGGER cours_en_ligne_updated BEFORE UPDATE ON public.cours_en_ligne FOR EACH ROW EXECUTE FUNCTION public.cours_update_timestamp();

GRANT SELECT ON public.cours_en_ligne TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cours_en_ligne TO authenticated;
GRANT ALL ON public.cours_en_ligne TO service_role;
ALTER TABLE public.cours_en_ligne ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cours_lecture ON public.cours_en_ligne;
CREATE POLICY cours_lecture ON public.cours_en_ligne FOR SELECT TO anon, authenticated USING (actif OR public.est_super_admin());
DROP POLICY IF EXISTS cours_gestion ON public.cours_en_ligne;
CREATE POLICY cours_gestion ON public.cours_en_ligne FOR ALL TO authenticated USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

-- Stockage : vidéos, photos, manuscrits scannés et PDF (200 Mo maximum par fichier)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cours-en-ligne', 'cours-en-ligne', true, 209715200,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 209715200,
  allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'];

DROP POLICY IF EXISTS cours_fichiers_lecture ON storage.objects;
CREATE POLICY cours_fichiers_lecture ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cours-en-ligne' AND public.est_super_admin());
DROP POLICY IF EXISTS cours_fichiers_ajout ON storage.objects;
CREATE POLICY cours_fichiers_ajout ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cours-en-ligne' AND public.est_super_admin());
DROP POLICY IF EXISTS cours_fichiers_modif ON storage.objects;
CREATE POLICY cours_fichiers_modif ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cours-en-ligne' AND public.est_super_admin()) WITH CHECK (bucket_id = 'cours-en-ligne' AND public.est_super_admin());
DROP POLICY IF EXISTS cours_fichiers_suppr ON storage.objects;
CREATE POLICY cours_fichiers_suppr ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cours-en-ligne' AND public.est_super_admin());

/* ===================== GUIDE DES NOUVEAUX BACHELIERS ===================== */
CREATE TABLE IF NOT EXISTS public.guide_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie text NOT NULL CHECK (length(trim(categorie)) BETWEEN 1 AND 80),
  titre text NOT NULL CHECK (length(trim(titre)) BETWEEN 1 AND 200),
  contenu text NOT NULL CHECK (length(contenu) <= 10000),
  lien text CHECK (lien IS NULL OR lien ~* '^https?://'),
  ordre integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS guide_articles_titre_uniq ON public.guide_articles (lower(titre));
DROP TRIGGER IF EXISTS guide_articles_updated ON public.guide_articles;
CREATE TRIGGER guide_articles_updated BEFORE UPDATE ON public.guide_articles FOR EACH ROW EXECUTE FUNCTION public.cours_update_timestamp();

GRANT SELECT ON public.guide_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.guide_articles TO authenticated;
GRANT ALL ON public.guide_articles TO service_role;
ALTER TABLE public.guide_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guide_lecture ON public.guide_articles;
CREATE POLICY guide_lecture ON public.guide_articles FOR SELECT TO anon, authenticated USING (actif OR public.est_super_admin());
DROP POLICY IF EXISTS guide_gestion ON public.guide_articles;
CREATE POLICY guide_gestion ON public.guide_articles FOR ALL TO authenticated USING (public.est_super_admin()) WITH CHECK (public.est_super_admin());

-- Contenus de départ (modifiables ou supprimables depuis l'espace super administrateur)
INSERT INTO public.guide_articles (categorie, titre, contenu, lien, ordre) VALUES
('Découvrir Campus Faso', 'Qu''est-ce que Campus Faso ?',
 'Campus Faso est la plateforme numérique nationale de l''enseignement supérieur du Burkina Faso, gérée par le ministère en charge de l''enseignement supérieur.

Elle sert notamment à :
- l''orientation des nouveaux bacheliers dans les universités et instituts publics ;
- l''inscription (ou la réinscription) dans ton établissement ;
- le suivi de ton parcours : informations personnelles, résultats et documents ;
- certaines démarches liées aux œuvres sociales (aides, logement, restauration) selon les périodes.

Toutes les démarches officielles se font sur le site officiel. CampusLink t''explique simplement comment t''y prendre.', 'https://www.campusfaso.bf', 1),

('Découvrir Campus Faso', 'Le calendrier : quand faire quoi ?',
 'Les grandes étapes reviennent chaque année, juste après la proclamation des résultats du baccalauréat :
1. Ouverture de la plateforme pour la création des comptes des nouveaux bacheliers.
2. Période de saisie des choix d''orientation (vœux).
3. Publication des résultats d''orientation.
4. Inscriptions administratives dans l''établissement d''accueil.

Les dates exactes changent chaque année : suis les communiqués officiels du ministère et les annonces publiées sur Campus Faso. Ne laisse pas passer la date limite !', 'https://www.campusfaso.bf', 2),

('Créer son compte', 'Comment créer son compte Campus Faso',
 '1. Va sur le site officiel www.campusfaso.bf (depuis un téléphone ou un ordinateur).
2. Clique sur le bouton de création de compte / d''inscription réservé aux nouveaux bacheliers.
3. Renseigne les informations de ton baccalauréat (numéro de table / matricule, année, série) et ta date de naissance, exactement comme sur ton relevé.
4. Indique une adresse e-mail et un numéro de téléphone que tu utilises vraiment : ils serviront à te contacter et à récupérer ton compte.
5. Choisis un mot de passe solide et note-le dans un endroit sûr.
6. Valide, puis vérifie tes informations personnelles une fois connecté.

Astuce : prépare ton relevé de notes du bac et une photo d''identité récente avant de commencer.', 'https://www.campusfaso.bf', 3),

('Créer son compte', 'Se connecter et récupérer son mot de passe',
 'Pour te connecter : rends-toi sur www.campusfaso.bf, clique sur « Connexion », saisis ton identifiant et ton mot de passe.

Mot de passe oublié ? Utilise le lien « Mot de passe oublié » sur la page de connexion et suis les instructions reçues par e-mail ou SMS.

Conseils :
- Ne partage jamais ton mot de passe, même avec un « intermédiaire » qui propose de faire tes démarches.
- Déconnecte-toi toujours après avoir utilisé un ordinateur de cybercafé.', 'https://www.campusfaso.bf', 4),

('Orientation', 'Bien choisir ses vœux d''orientation',
 'Une fois connecté, tu peux saisir plusieurs choix de filières, classés par ordre de préférence.

Avant de choisir :
- Vérifie les séries de bac acceptées pour chaque filière.
- Regarde la ville et l''établissement (Ouagadougou, Bobo-Dioulasso, Koudougou, Ouahigouya, Fada N''Gourma, Dédougou…).
- Pense aux débouchés : quels métiers après cette filière ?
- Classe en premier ce que tu veux vraiment, mais ajoute aussi des choix « sûrs ».

Tu peux généralement modifier tes vœux tant que la période de saisie n''est pas terminée. Valide bien ton choix final avant la date limite.', 'https://www.campusfaso.bf', 5),

('Orientation', 'Consulter son résultat d''orientation',
 'À la date annoncée par le ministère, connecte-toi à ton compte Campus Faso : ton résultat d''orientation (filière et établissement retenus) s''affiche dans ton espace.

Si tu es orienté : prépare rapidement ton inscription administrative.
Si tu n''es pas satisfait ou pas retenu : surveille les communiqués concernant d''éventuelles sessions complémentaires ou réorientations.', 'https://www.campusfaso.bf', 6),

('Inscription', 'Faire son inscription administrative',
 'Après ton orientation, tu dois finaliser ton inscription dans l''établissement d''accueil :
1. Connecte-toi à Campus Faso et suis l''étape d''inscription.
2. Règle les frais d''inscription selon les moyens proposés (paiement mobile ou autre, selon les consignes officielles). Garde toujours la preuve de paiement.
3. Télécharge et imprime ta fiche d''inscription.
4. Présente-toi à ton établissement avec les pièces demandées (copie du diplôme ou attestation du bac, acte de naissance, photos d''identité, fiche d''inscription…) pour obtenir ta carte d''étudiant.', 'https://www.campusfaso.bf', 7),

('Suivre sa scolarité', 'Voir ses notes et son bulletin',
 'Selon ton établissement, tes résultats peuvent être consultés :
- sur ton compte Campus Faso, rubrique dédiée aux résultats / au parcours ;
- sur ton espace étudiant CampusLink, si ton université est partenaire (notes, annonces et emploi du temps) ;
- par affichage officiel à l''université.

En cas d''erreur sur une note, adresse-toi à la scolarité de ton UFR ou de ton institut.', 'https://www.campusfaso.bf', 8),

('Suivre sa scolarité', 'Aides, logement et restauration',
 'Les œuvres sociales universitaires (aides, prêts, logement en cité, restauration) dépendent du CENOU et des structures nationales compétentes. Certaines demandes passent par Campus Faso pendant des périodes précises.

Surveille les communiqués officiels et dépose tes demandes dans les délais.', NULL, 9),

('Conseils pratiques', 'Éviter les arnaques et les erreurs',
 '- Utilise uniquement le site officiel : www.campusfaso.bf.
- Personne n''a besoin de ton mot de passe pour t''aider.
- Ne paie jamais un « intermédiaire » pour être orienté : l''orientation ne s''achète pas.
- Fais des captures d''écran de chaque étape validée (création de compte, vœux, paiement).
- En cas de problème, rapproche-toi de la scolarité de ton établissement ou des services officiels d''assistance indiqués sur Campus Faso.', 'https://www.campusfaso.bf', 10),

('Conseils pratiques', 'Utiliser CampusLink en plus de Campus Faso',
 'Campus Faso gère les démarches officielles. CampusLink t''accompagne au quotidien :
- Espace étudiant : notes, annonces et emploi du temps (universités partenaires) ;
- Cours en ligne : cours classés par filière, niveau et module ;
- Révision & IA, Bibliothèque, Opportunités et Événements.

Bienvenue à l''université, et bon courage !', NULL, 11)
ON CONFLICT DO NOTHING;

COMMIT;
