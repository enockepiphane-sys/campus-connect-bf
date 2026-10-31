import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Les tables de la bibliothèque ne sont pas dans les types générés : client non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export const BIBLIO_BUCKET = "bibliotheque";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export type Theme = { id: string; nom: string; description: string | null; couleur: string; ordre: number };
export type Doc = {
  id: string;
  theme_id: string;
  titre: string;
  auteur: string | null;
  description: string | null;
  fichier_path: string;
  fichier_type: string;
  taille: number | null;
  actif: boolean;
  created_at: string;
};
export type Proposition = {
  id: string;
  titre: string;
  auteur: string | null;
  commentaire: string | null;
  statut: "nouvelle" | "retenue" | "refusee";
  created_at: string;
};

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205"].includes(error.code ?? "")) throw new Error("La bibliothèque n’a pas encore été activée. Contactez l’administrateur.");
  if (error.code === "42501") throw new Error("Vous n’avez pas l’autorisation d’effectuer cette action.");
  if (error.code === "23503") throw new Error("Ce thème contient encore des documents. Supprimez-les ou déplacez-les d’abord.");
  if (error.code === "23505") throw new Error("Un thème porte déjà ce nom.");
  throw new Error("L’opération a échoué. Vérifiez votre connexion puis réessayez.");
}

export async function listThemes(): Promise<Theme[]> {
  const { data, error } = await db.from("bibliotheque_themes").select("*").order("ordre").order("nom");
  check(error);
  return (data ?? []) as Theme[];
}

// management=false : seulement les documents publiés (page publique)
export async function listDocuments(management = false): Promise<Doc[]> {
  let q = db.from("bibliotheque_documents").select("*").order("created_at", { ascending: false });
  if (!management) q = q.eq("actif", true);
  const { data, error } = await q;
  check(error);
  return (data ?? []) as Doc[];
}

export function fileUrl(doc: Pick<Doc, "fichier_path">, downloadName?: string) {
  const options = downloadName ? { download: downloadName } : undefined;
  return supabase.storage.from(BIBLIO_BUCKET).getPublicUrl(doc.fichier_path, options).data.publicUrl;
}

export function extensionOf(type: string) {
  return type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

export function formatSize(bytes: number | null) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

export async function proposeBook(input: { titre: string; auteur: string; commentaire: string }) {
  const { error } = await db.from("bibliotheque_propositions").insert({
    titre: input.titre.trim(),
    auteur: input.auteur.trim() || null,
    commentaire: input.commentaire.trim() || null,
  });
  check(error);
}

/* ---------- Gestion (super administrateur) ---------- */

export async function saveTheme(input: { id?: string; nom: string; description: string; couleur: string; ordre: number }) {
  const row = { nom: input.nom.trim(), description: input.description.trim() || null, couleur: input.couleur, ordre: input.ordre };
  const { error } = input.id ? await db.from("bibliotheque_themes").update(row).eq("id", input.id) : await db.from("bibliotheque_themes").insert(row);
  check(error);
}

export async function deleteTheme(id: string) {
  const { error } = await db.from("bibliotheque_themes").delete().eq("id", id);
  check(error);
}

export async function addDocument(input: { file: File; theme_id: string; titre: string; auteur: string; description: string; actif: boolean }) {
  const { file } = input;
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Formats acceptés : PDF, JPG, PNG ou WebP.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Le fichier dépasse 50 Mo.");
  const path = `${input.theme_id}/${crypto.randomUUID()}.${extensionOf(file.type)}`;
  const { error: upError } = await supabase.storage.from(BIBLIO_BUCKET).upload(path, file, { contentType: file.type });
  if (upError) throw new Error("L’envoi du fichier a échoué (" + upError.message + ").");
  const { error } = await db.from("bibliotheque_documents").insert({
    theme_id: input.theme_id,
    titre: input.titre.trim(),
    auteur: input.auteur.trim() || null,
    description: input.description.trim() || null,
    fichier_path: path,
    fichier_type: file.type,
    taille: file.size,
    actif: input.actif,
  });
  if (error) {
    await supabase.storage.from(BIBLIO_BUCKET).remove([path]);
    check(error);
  }
}

export async function updateDocument(id: string, input: { theme_id: string; titre: string; auteur: string; description: string; actif: boolean }) {
  const { error } = await db
    .from("bibliotheque_documents")
    .update({ theme_id: input.theme_id, titre: input.titre.trim(), auteur: input.auteur.trim() || null, description: input.description.trim() || null, actif: input.actif })
    .eq("id", id);
  check(error);
}

export async function deleteDocument(doc: Doc) {
  const { error } = await db.from("bibliotheque_documents").delete().eq("id", doc.id);
  check(error);
  await supabase.storage.from(BIBLIO_BUCKET).remove([doc.fichier_path]);
}

export async function listPropositions(): Promise<Proposition[]> {
  const { data, error } = await db.from("bibliotheque_propositions").select("*").order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Proposition[];
}

export async function setPropositionStatus(id: string, statut: Proposition["statut"]) {
  const { error } = await db.from("bibliotheque_propositions").update({ statut }).eq("id", id);
  check(error);
}

export async function deleteProposition(id: string) {
  const { error } = await db.from("bibliotheque_propositions").delete().eq("id", id);
  check(error);
}
