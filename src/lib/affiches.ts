import { supabase } from "@/integrations/supabase/client";

export const AFFICHES_BUCKET = "affiches-evenements";

/** Génère une URL signée temporaire pour une affiche d'événement. */
export async function afficheUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(AFFICHES_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/** Résout en parallèle les URLs signées d'une liste de chemins. */
export async function afficheUrls(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const uniques = Array.from(new Set(paths.filter(Boolean) as string[]));
  const out: Record<string, string> = {};
  await Promise.all(
    uniques.map(async (p) => {
      const url = await afficheUrl(p);
      if (url) out[p] = url;
    }),
  );
  return out;
}
