# CampusLink — Plan de construction

Plateforme web pour universités et étudiants du Burkina Faso, avec 3 interfaces (Étudiant, Administrateur d'établissement, Super Administrateur). Je vais construire par étapes et te montrer le résultat avant de passer à la suivante.

## Étape 1 — Fondations
- Activer Lovable Cloud (base de données, auth, storage) — nécessaire dès le départ car toute la logique repose dessus.
- Design system sombre + rayures verticales vert/noir (identité BF) dans `src/styles.css`.
- Page d'accueil : logo CampusLink 🇧🇫, menu hamburger (Fonctionnalités, Cours en ligne, Devenir partenaire, Politique de confidentialité), 2 blocs (Espace Étudiant / Espace Administrateur).
- Pages secondaires du menu avec bouton Retour.
- Formulaire "Devenir partenaire" qui écrit dans une table `demandes_partenariat`.
- Schéma SQL initial :
  - `etablissements` (nom, email, téléphone, adresse, description, statut)
  - `admins_pre_autorises` (nom, email, date_naissance, etablissement_id)
  - `super_admins` (email)
  - `demandes_partenariat`
  - `user_roles` + enum `app_role` ('super_admin','admin','etudiant') + fonction `has_role`
- Grants + RLS de base (public : lecture des établissements actifs, colonnes non sensibles).

## Étape 2 — Super Administrateur
- Route cachée `/super-admin-acces` (non liée depuis l'UI publique).
- Connexion email+mot de passe, vérif que l'email est dans `super_admins`, sinon "Accès non autorisé".
- Dashboard :
  1. CRUD établissements
  2. Pré-autoriser un admin par établissement (nom, email, date de naissance)
  3. Liste des établissements + statut
  4. Liste des demandes de partenariat
- Seed initial : les 13 établissements listés.

## Étape 3 — Administrateur d'établissement
- Inscription : choix établissement → nom+email+date naissance → vérif dans `admins_pre_autorises` → `signUp` avec confirmation email → création mot de passe → rôle 'admin' + lien vers `etablissement_id`.
- Cas d'erreur : non pré-autorisé, déjà inscrit.
- Connexion classique + message si non inscrit.
- Interface admin :
  1. Filières (`filieres`)
  2. Niveaux par filière (`niveaux`)
  3. Espace isolé par niveau :
     - a) Liste étudiants (import CSV → `etudiants_pre_inscrits`)
     - b) Modules/matières (`matieres`) + import notes CSV (`notes`)
     - c) Annonces (`annonces`)
     - d) Événements (`evenements`)
     - e) Emploi du temps (`emplois_du_temps`)

## Étape 4 — Étudiant
- Inscription : établissement → filière → niveau → nom+email+date naissance → vérif dans `etudiants_pre_inscrits` → `signUp` → mot de passe → rôle 'etudiant' lié au triplet.
- Cas d'erreur : non pré-inscrit, déjà inscrit.
- Connexion + message si non inscrit.
- Interface étudiant :
  1. Annonces de son niveau/filière
  2. Emploi du temps
  3. Événements
  4. Ses notes uniquement (par matière)

## Étape 5 — Sécurité RLS
Politiques strictes :
- `etablissements` : anon SELECT sur nom/statut (statut='actif'), email/téléphone réservés aux admins authentifiés (via vue ou colonnes séparées).
- `parametres_plateforme` : lecture admin/super_admin uniquement.
- `admins_pre_autorises` : SELECT anon limité par email exact (RPC dédiée).
- `etudiants_pre_inscrits` : idem, RPC de vérif.
- `notes` : chaque étudiant lit uniquement ses propres notes (`auth.uid()`).
- `annonces` / `evenements` / `emplois_du_temps` : lecture par étudiants du même niveau/filière, écriture par admin de l'établissement.
- Rôles stockés dans `user_roles` (jamais sur profil), avec `has_role()` SECURITY DEFINER.

## Étape 6 — Finition visuelle
- Cohérence dégradé sombre + rayures vert/noir sur toute la home et les pages d'auth.
- Drapeau BF à côté du logo.
- Responsive, animations discrètes, polices lisibles.

## Détails techniques
- Stack : TanStack Start + React + Tailwind v4 + Lovable Cloud (Supabase managé).
- Auth : `supabase.auth.signUp` avec `emailRedirectTo` vers page `/set-password`.
- Import CSV : parsing côté client (papaparse), insertion via server function protégée par `requireSupabaseAuth` + vérif rôle admin de l'établissement concerné.
- Route protégée admin : `_authenticated/admin/*` ; étudiant : `_authenticated/etudiant/*` ; super admin : `_authenticated/super-admin/*` avec gate `has_role`.
- Emails de confirmation : templates Supabase par défaut (personnalisables ensuite).

Je commence par l'**Étape 1** dès validation.
