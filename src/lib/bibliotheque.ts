import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { preparerImage, supprimerImage, type ImageChoix } from "./images-contenu";
import { analyserLien } from "./lecture-externe";

// Les tables de la bibliothèque ne sont pas dans les types générés : client non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export const BIBLIO_BUCKET = "bibliotheque";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", ...VIDEO_TYPES];
export const FILE_ACCEPT = "application/pdf,.pdf,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm";
export const isVideoType = (type: string | null | undefined) => Boolean(type?.startsWith("video/"));

/** Message d'erreur si le fichier n'est pas accepté, sinon null. */
export function validateDocFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Formats acceptés : PDF, photo (JPG, PNG, WebP) ou vidéo (MP4, WebM, MOV).";
  if (isVideoType(file.type) ? file.size > MAX_VIDEO_BYTES : file.size > MAX_FILE_BYTES) return isVideoType(file.type) ? "La vidéo dépasse 200 Mo." : "Le fichier dépasse 50 Mo.";
  return null;
}

export type Theme = { id: string; nom: string; description: string | null; couleur: string; ordre: number };
export type Doc = {
  id: string;
  theme_id: string;
  titre: string;
  auteur: string | null;
  description: string | null;
  fichier_path: string | null; // null pour un document ajouté par lien
  fichier_type: string | null;
  taille: number | null;
  lien_url?: string | null; // lien externe lu dans le lecteur intégré
  image_path?: string | null;
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
  if (!doc.fichier_path) return "";
  const options = downloadName ? { download: downloadName } : undefined;
  return supabase.storage.from(BIBLIO_BUCKET).getPublicUrl(doc.fichier_path, options).data.publicUrl;
}

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
export function extensionOf(type: string | null) {
  if (!type) return "bin";
  return EXT[type] ?? "jpg";
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

export async function addDocument(input: { file: File; theme_id: string; titre: string; auteur: string; description: string; actif: boolean; image?: ImageChoix }) {
  const { file } = input;
  const invalid = validateDocFile(file);
  if (invalid) throw new Error(invalid);
  const path = `${input.theme_id}/${crypto.randomUUID()}.${extensionOf(file.type)}`;
  const { error: upError } = await supabase.storage.from(BIBLIO_BUCKET).upload(path, file, { contentType: file.type });
  if (upError) throw new Error("L’envoi du fichier a échoué (" + upError.message + ").");
  let img: Awaited<ReturnType<typeof preparerImage>>;
  try { img = await preparerImage(input.image, null, "bibliotheque"); } catch (e) { await supabase.storage.from(BIBLIO_BUCKET).remove([path]); throw e; }
  const { error } = await db.from("bibliotheque_documents").insert({
    ...img.patch,
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
    await img.annuler();
    await supabase.storage.from(BIBLIO_BUCKET).remove([path]);
    check(error);
  }
}

/** Ajoute un document par lien externe (lecteur intégré quand la plateforme l'autorise). */
export async function addLienDocument(input: { lien: string; theme_id: string; titre: string; auteur: string; description: string; actif: boolean; image?: ImageChoix }) {
  const a = analyserLien(input.lien);
  if (!a.ok) throw new Error(a.erreur);
  const img = await preparerImage(input.image, null, "bibliotheque");
  const { error } = await db.from("bibliotheque_documents").insert({
    ...img.patch,
    theme_id: input.theme_id,
    titre: input.titre.trim(),
    auteur: input.auteur.trim() || null,
    description: input.description.trim() || null,
    lien_url: a.url,
    actif: input.actif,
  });
  if (error) await img.annuler();
  check(error);
}

export async function updateDocument(id: string, input: { theme_id: string; titre: string; auteur: string; description: string; actif: boolean; image?: ImageChoix; imageActuelle?: string | null; lien?: string }) {
  let lien: string | undefined;
  if (input.lien !== undefined) {
    const a = analyserLien(input.lien);
    if (!a.ok) throw new Error(a.erreur);
    lien = a.url;
  }
  const img = await preparerImage(input.image, input.imageActuelle, "bibliotheque");
  const { error } = await db
    .from("bibliotheque_documents")
    .update({ theme_id: input.theme_id, titre: input.titre.trim(), auteur: input.auteur.trim() || null, description: input.description.trim() || null, actif: input.actif, ...(lien ? { lien_url: lien } : {}), ...img.patch })
    .eq("id", id);
  if (error) await img.annuler();
  check(error);
  await img.valider();
}

export async function deleteDocument(doc: Doc) {
  const { error } = await db.from("bibliotheque_documents").delete().eq("id", doc.id);
  check(error);
  await supprimerImage(doc.image_path);
  if (doc.fichier_path) await supabase.storage.from(BIBLIO_BUCKET).remove([doc.fichier_path]);
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
