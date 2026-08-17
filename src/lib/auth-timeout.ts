/**
 * Wraps a promise with a timeout. Throws a clear error if it exceeds the delay.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 10000, label = "opération"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Délai dépassé (${Math.round(ms / 1000)}s) sur ${label}. Vérifiez votre connexion internet et réessayez.`));
    }, ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export function humanizeAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (!msg) return "Une erreur est survenue. Réessayez dans un instant.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.";
  }
  if (/Invalid API key|Invalid api key/i.test(msg)) {
    return "Le service est temporairement indisponible. Réessayez dans quelques instants ou contactez le support si le problème persiste.";
  }
  if (/Invalid login credentials/i.test(msg)) {
    return "Email ou mot de passe incorrect.";
  }
  if (/already confirmed/i.test(msg)) {
    return "Ce compte est déjà confirmé. Vous pouvez vous connecter directement.";
  }
  if (/rate limit|too many requests|after \d+ seconds|429/i.test(msg)) {
    return "Trop de tentatives. Veuillez patienter un instant avant de réessayer.";
  }
  if (/User already registered|already been registered|User already/i.test(msg)) {
    return "Un compte existe déjà avec cet email.";
  }
  if (/expired|Token has expired/i.test(msg)) {
    return "Ce lien a expiré. Recommencez la procédure depuis le début.";
  }
  // Filet de sécurité : ne jamais laisser passer un message technique brut
  // (issu de Supabase ou d'ailleurs) qui n'a pas été explicitement reconnu
  // et reformulé ci-dessus.
  return "Une erreur est survenue. Réessayez dans un instant ou contactez le support si le problème persiste.";
}

/**
 * Reformule les erreurs de requêtes base de données (Supabase Postgres/PostgREST)
 * en messages compréhensibles, sans jamais exposer de détails techniques
 * (noms de contraintes SQL, de tables, de colonnes, codes internes) aux
 * utilisateurs de l'application.
 */
export function humanizeDbError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (!msg) return "Une erreur est survenue. Réessayez dans un instant.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.";
  }
  if (/duplicate key|already exists|unique constraint/i.test(msg)) {
    return "Cet élément existe déjà.";
  }
  if (/violates foreign key|foreign key constraint/i.test(msg)) {
    return "Impossible d'effectuer cette action : des données liées existent encore.";
  }
  if (/violates row-level security|permission denied|RLS/i.test(msg)) {
    return "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
  }
  if (/violates not-null constraint|null value/i.test(msg)) {
    return "Un champ obligatoire est manquant.";
  }
  if (/invalid input syntax/i.test(msg)) {
    return "Une des valeurs saisies n'est pas dans un format valide.";
  }
  if (/rate limit|too many requests|429/i.test(msg)) {
    return "Trop de tentatives. Veuillez patienter un instant avant de réessayer.";
  }
  if (/timeout|timed out/i.test(msg)) {
    return "Le serveur met trop de temps à répondre. Réessayez dans un instant.";
  }
  // Filet de sécurité : jamais de message technique brut affiché tel quel.
  return "Une erreur est survenue lors de l'opération. Réessayez dans un instant ou contactez le support si le problème persiste.";
}
