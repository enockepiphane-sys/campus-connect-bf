/**
 * URL de base utilisée pour les redirections email (emailRedirectTo).
 * Priorité : domaine actif côté navigateur -> variables d'env -> fallback prod.
 */
const FALLBACK_PRODUCTION_SITE_URL = "https://campuslink-bf.app";

function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return normalize(window.location.origin);
  }

  const envSiteUrl =
    import.meta.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return normalize(envSiteUrl || FALLBACK_PRODUCTION_SITE_URL);
}
