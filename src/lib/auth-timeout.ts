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
  if (!msg) return "Erreur inconnue.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) {
    return "Une erreur s'est produite. Vérifiez votre connexion ou réessayez dans quelques secondes.";
  }
  if (/Invalid API key|Invalid api key/i.test(msg)) {
    return "Une erreur s'est produite. Contactez l'administrateur.";
  }
  if (/Invalid login credentials/i.test(msg)) {
    return "Email ou mot de passe incorrect.";
  }
  if (/Password should contain at least one character of each/i.test(msg)) {
    return "Votre mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule et un chiffre.";
  }
  if (/Password should be at least (\d+) characters/i.test(msg)) {
    const match = msg.match(/at least (\d+) characters/i);
    return `Votre mot de passe doit contenir au moins ${match?.[1] ?? "6"} caractères.`;
  }
  if (/should be different from the old password|New password should be different/i.test(msg)) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (/User not found/i.test(msg)) {
    return "Aucun compte trouvé avec cette adresse email.";
  }
  if (/Email rate limit exceeded|rate limit/i.test(msg)) {
    return "Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.";
  }
  if (/Token has expired|otp_expired|invalid.*token|token.*not found|expired|invalid_grant|Email link is invalid or has expired/i.test(msg)) {
    return "Ce lien a expiré ou a déjà été utilisé. Recommencez la procédure depuis le début.";
  }
  if (/User already registered/i.test(msg)) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  return "Une erreur est survenue. Vérifiez les informations saisies et réessayez.";
}

/**
 * Traduit les erreurs de base de données (Postgres/Supabase, hors Auth)
 * en messages compréhensibles pour l'utilisateur — évite d'afficher un
 * message technique brut (code de contrainte SQL, nom de colonne, etc.).
 */
export function humanizeDbError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const code = (err as { code?: string } | null)?.code ?? "";
  if (!raw) return "Erreur inconnue.";

  if (code === "23505" || /duplicate key value violates unique constraint/i.test(raw)) {
    return "Cette valeur existe déjà (doublon). Vérifiez les informations saisies.";
  }
  if (code === "23503" || /violates foreign key constraint/i.test(raw)) {
    return "Cette action est impossible car l'élément est lié à d'autres données existantes.";
  }
  if (code === "23502" || /null value in column .* violates not-null constraint/i.test(raw)) {
    return "Un champ obligatoire est manquant. Vérifiez que tous les champs requis sont remplis.";
  }
  if (code === "23514" || /violates check constraint/i.test(raw)) {
    return "Une des valeurs saisies ne respecte pas les règles autorisées.";
  }
  if (code === "42501" || /permission denied|row-level security/i.test(raw)) {
    return "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
  }
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return "Impossible de contacter le serveur. Vérifiez votre connexion ou réessayez dans quelques secondes.";
  }
  if (/JWT expired|invalid.*jwt/i.test(raw)) {
    return "Votre session a expiré. Merci de vous reconnecter.";
  }
  return "Une erreur est survenue lors de l'enregistrement. Vérifiez les informations saisies et réessayez.";
}
