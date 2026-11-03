import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { validateOffre, type OffreInput, type Opportunite } from "./opportunites-model";
import { preparerImage, supprimerImage, type ImageChoix } from "./images-contenu";

type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
type Favori = { user_id: string; opportunite_id: string; created_at: string };
// Extension locale : ne remplace pas les types générés des fonctions existantes.
type SharedDatabase = { public: Omit<Database["public"], "Tables" | "Functions"> & {
  Tables: Database["public"]["Tables"] & {
    opportunites: Table<Opportunite, OffreInput & { created_by: string; image_path?: string | null }, Partial<OffreInput> & { image_path?: string | null }>;
    opportunites_favoris: Table<Favori, Pick<Favori, "user_id" | "opportunite_id">, never>;
  };
  Functions: Database["public"]["Functions"] & { peut_gerer_opportunites: { Args: Record<string, never>; Returns: boolean } };
} };
const client = supabase as unknown as SupabaseClient<SharedDatabase>;
function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205", "PGRST202"].includes(error.code ?? "")) throw new Error("L’espace Opportunités n’a pas encore été activé. Contactez l’administrateur.");
  if (error.code === "42501") throw new Error("Vous n’avez pas l’autorisation d’effectuer cette action.");
  throw new Error("L’opération a échoué. Vérifiez votre connexion puis réessayez.");
}
export async function listOffres(management = false) {
  let query = client.from("opportunites").select("*").order("date_limite", { ascending: true });
  if (!management) query = query.eq("publie", true);
  const { data, error } = await query; check(error); return data ?? [];
}
export async function favoriteIds() {
  const { data, error } = await client.from("opportunites_favoris").select("opportunite_id");
  check(error); return (data ?? []).map(row => row.opportunite_id);
}
export async function setFavorite(id: string, active: boolean) {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error("Reconnectez-vous pour enregistrer une offre.");
  const query = active
    ? client.from("opportunites_favoris").upsert({ user_id: data.user.id, opportunite_id: id }, { onConflict: "user_id,opportunite_id" })
    : client.from("opportunites_favoris").delete().eq("user_id", data.user.id).eq("opportunite_id", id);
  const { error } = await query; check(error);
}
export async function canManage() { const { data, error } = await client.rpc("peut_gerer_opportunites"); check(error); return data === true; }
export async function saveOffre(input: OffreInput, id?: string, image?: ImageChoix, imageActuelle?: string | null) {
  const problem = validateOffre(input); if (problem) throw new Error(problem);
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) throw new Error("Reconnectez-vous pour publier une offre.");
  const img = await preparerImage(image, imageActuelle, "opportunites");
  const query = id ? client.from("opportunites").update({ ...input, ...img.patch }).eq("id", id) : client.from("opportunites").insert({ ...input, ...img.patch, created_by: data.user.id });
  const { data: saved, error } = await query.select("id").single();
  if (error || !saved) { await img.annuler(); check(error); throw new Error("L’offre n’a pas été enregistrée."); }
  await img.valider();
}
export async function deleteOffre(id: string, imagePath?: string | null) { const { data, error } = await client.from("opportunites").delete().eq("id", id).select("id").single(); check(error); if (!data) throw new Error("L’offre n’a pas été supprimée."); await supprimerImage(imagePath); }
