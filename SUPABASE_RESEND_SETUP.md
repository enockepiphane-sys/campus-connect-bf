# Supabase + Resend (expéditeur personnalisé)

Objectif: éviter l'expéditeur par défaut `no-reply@mail.lovable-app.email` et forcer l'envoi via votre SMTP Resend.

## 1) Vérifier le projet Supabase utilisé par l'app

Définissez ces variables d'environnement dans l'environnement de déploiement:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_PUBLISHABLE_KEY` côté client)
- `EXPECTED_SUPABASE_PROJECT_ID` (project ref Supabase attendu, ex: `pfvedlgkeeynjsigalus`)

Le code loggue un warning si l'URL Supabase pointe vers un autre project ref que `EXPECTED_SUPABASE_PROJECT_ID`.

## 2) Configurer SMTP custom dans Supabase

Dans le **dashboard Supabase** du bon projet:

1. `Auth` → `SMTP Settings`
2. Activez `Custom SMTP`
3. Renseignez les paramètres Resend (host, port, username, password/API key)
4. Sauvegardez

## 3) Configurer l'expéditeur Auth Email

Toujours dans Supabase (`Auth` → `Email`):

- `From email`: adresse de votre domaine vérifié (ex: `noreply@votredomaine.com`)
- `From name`: nom explicite (ex: `CampusLink`)

## 4) Vérifier le domaine dans Resend

- Domaine `Verified`
- DNS SPF + DKIM valides (DMARC recommandé)
- L'adresse `From email` doit appartenir à ce domaine

## 5) Tester dans Supabase

Déclenchez un email de test / reset mot de passe depuis Supabase:

- Si l'expéditeur reste `lovable-app.email` → la config SMTP/sender n'est pas appliquée sur ce projet
- Si c'est correct dans Supabase mais pas dans l'app → variables d'environnement de l'app incorrectes

## 6) Redéployer

Après correction des variables d'environnement, redémarrez/redéployez l'application.
