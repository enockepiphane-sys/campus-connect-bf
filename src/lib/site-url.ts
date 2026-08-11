/**
 * URL de production utilisée pour les redirections email (emailRedirectTo).
 * Supabase Auth exige une URL absolue et elle doit figurer dans les
 * Redirect URLs autorisées du backend.
 */
export const PRODUCTION_SITE_URL =
  "https://campuslink-bf.vercel.app";

export function getSiteUrl(): string {
  return PRODUCTION_SITE_URL;
}
