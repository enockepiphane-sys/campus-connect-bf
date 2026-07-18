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
    return "Impossible de contacter le serveur d'authentification. Vérifiez votre connexion ou réessayez dans quelques secondes.";
  }
  if (/Invalid API key|Invalid api key/i.test(msg)) {
    return "Clé API invalide côté serveur. Contactez l'administrateur (variables d'environnement Vercel manquantes).";
  }
  if (/Invalid login credentials/i.test(msg)) {
    return "Email ou mot de passe incorrect.";
  }
  return msg;
}
