import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export const CATEGORIES_GUIDE = ["Découvrir Campus Faso", "Créer son compte", "Orientation", "Inscription", "Suivre sa scolarité", "Conseils pratiques"];

export type GuideArticle = {
  id: string;
  categorie: string;
  titre: string;
  contenu: string;
  lien: string | null;
  ordre: number;
  actif: boolean;
};
export type GuideInput = { categorie: string; titre: string; contenu: string; lien: string; ordre: number; actif: boolean };

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205"].includes(error.code ?? "")) throw new Error("Le guide n’a pas encore été activé. Contactez l’administrateur.");
  if (error.code === "42501") throw new Error("Vous n’avez pas l’autorisation d’effectuer cette action.");
  if (error.code === "23505") throw new Error("Une fiche porte déjà ce titre.");
  if (error.code === "23514") throw new Error("Certaines informations sont invalides (le lien doit commencer par https://).");
  throw new Error("L’opération a échoué. Vérifiez votre connexion puis réessayez.");
}

export async function listGuide(management = false): Promise<GuideArticle[]> {
  let q = db.from("guide_articles").select("*").order("ordre").order("titre");
  if (!management) q = q.eq("actif", true);
  const { data, error } = await q;
  check(error);
  return (data ?? []) as GuideArticle[];
}

export async function saveGuide(input: GuideInput, id?: string) {
  const row = {
    categorie: input.categorie.trim(),
    titre: input.titre.trim(),
    contenu: input.contenu.trim(),
    lien: input.lien.trim() || null,
    ordre: input.ordre,
    actif: input.actif,
  };
  const { error } = id ? await db.from("guide_articles").update(row).eq("id", id) : await db.from("guide_articles").insert(row);
  check(error);
}

export async function deleteGuide(id: string) {
  const { error } = await db.from("guide_articles").delete().eq("id", id);
  check(error);
}
