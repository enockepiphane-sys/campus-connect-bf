import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { preparerImage, supprimerImage, type ImageChoix } from "./images-contenu";

// Les tables des cours en ligne ne sont pas dans les types générés : client non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export const COURS_BUCKET = "cours-en-ligne";
export const MAX_COURS_BYTES = 200 * 1024 * 1024;
export const NIVEAUX = ["L1", "L2", "L3", "M1", "M2", "Doctorat", "BTS 1", "BTS 2", "Autre"] as const;
export type Niveau = (typeof NIVEAUX)[number];
export type TypeContenu = "video" | "photo" | "manuscrit" | "pdf";
export const TYPES: { value: TypeContenu; label: string; accept: string; mimes: string[] }[] = [
  { value: "video", label: "Vidéo", accept: "video/mp4,video/webm,video/quicktime", mimes: ["video/mp4", "video/webm", "video/quicktime"] },
  { value: "pdf", label: "PDF", accept: "application/pdf", mimes: ["application/pdf"] },
  { value: "manuscrit", label: "Manuscrit (scan ou photo)", accept: "application/pdf,image/jpeg,image/png,image/webp", mimes: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
  { value: "photo", label: "Photo", accept: "image/jpeg,image/png,image/webp", mimes: ["image/jpeg", "image/png", "image/webp"] },
];
export const FILIERES_SUGGEREES = ["Droit", "Informatique", "Économie", "Gestion", "Mathématiques", "Physique", "Chimie", "Biologie", "Médecine", "Lettres modernes", "Anglais", "Histoire", "Géographie", "Sociologie", "Philosophie"];

export type Cours = {
  id: string;
  filiere: string;
  niveau: Niveau;
  module: string;
  titre: string;
  description: string | null;
  enseignant: string | null;
  type_contenu: TypeContenu;
  fichier_path: string | null;
  fichier_type: string | null;
  taille: number | null;
  video_url: string | null;
  image_path?: string | null;
  actif: boolean;
  created_at: string;
};

export type CoursInput = {
  filiere: string;
  niveau: Niveau;
  module: string;
  titre: string;
  description: string;
  enseignant: string;
  type_contenu: TypeContenu;
  video_url: string;
  actif: boolean;
};

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205"].includes(error.code ?? "")) throw new Error("Les cours en ligne n’ont pas encore été activés. Contactez l’administrateur.");
  if (error.code === "42501") throw new Error("Vous n’avez pas l’autorisation d’effectuer cette action.");
  if (error.code === "23514") throw new Error("Certaines informations sont invalides (lien, niveau ou fichier manquant).");
  throw new Error("L’opération a échoué. Vérifiez votre connexion puis réessayez.");
}

export async function listCours(management = false): Promise<Cours[]> {
  let q = db.from("cours_en_ligne").select("*").order("filiere").order("niveau").order("module").order("created_at", { ascending: false });
  if (!management) q = q.eq("actif", true);
  const { data, error } = await q;
  check(error);
  return (data ?? []) as Cours[];
}

export function coursFileUrl(c: Pick<Cours, "fichier_path">, downloadName?: string) {
  if (!c.fichier_path) return "";
  const options = downloadName ? { download: downloadName } : undefined;
  return supabase.storage.from(COURS_BUCKET).getPublicUrl(c.fichier_path, options).data.publicUrl;
}

const EXT: Record<string, string> = {
  "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};
export const extensionOf = (type: string) => EXT[type] ?? "bin";

export function formatSize(bytes: number | null) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

// Transforme un lien YouTube / Vimeo en lien intégrable ; null si non reconnu.
export function embedUrl(url: string | null): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function validateFile(type: TypeContenu, file: File): string | null {
  const t = TYPES.find((x) => x.value === type)!;
  if (!t.mimes.includes(file.type)) return `Format non accepté pour « ${t.label} ».`;
  if (file.size > MAX_COURS_BYTES) return "Le fichier dépasse 200 Mo.";
  return null;
}

function row(input: CoursInput) {
  return {
    filiere: input.filiere.trim(),
    niveau: input.niveau,
    module: input.module.trim(),
    titre: input.titre.trim(),
    description: input.description.trim() || null,
    enseignant: input.enseignant.trim() || null,
    type_contenu: input.type_contenu,
    video_url: input.video_url.trim() || null,
    actif: input.actif,
  };
}

async function upload(file: File, filiere: string) {
  const dossier = filiere.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "cours";
  const path = `${dossier}/${crypto.randomUUID()}.${extensionOf(file.type)}`;
  const { error } = await supabase.storage.from(COURS_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error("L’envoi du fichier a échoué (" + error.message + ").");
  return { fichier_path: path, fichier_type: file.type, taille: file.size };
}

export async function addCours(input: CoursInput, file: File | null, image?: ImageChoix) {
  if (!file && !input.video_url.trim()) throw new Error("Ajoutez un fichier ou un lien vidéo.");
  const fichier = file ? await upload(file, input.filiere) : {};
  let img: Awaited<ReturnType<typeof preparerImage>>;
  try { img = await preparerImage(image, null, "cours"); } catch (e) { if ("fichier_path" in fichier) await supabase.storage.from(COURS_BUCKET).remove([fichier.fichier_path as string]); throw e; }
  const { error } = await db.from("cours_en_ligne").insert({ ...row(input), ...fichier, ...img.patch });
  if (error) {
    await img.annuler();
    if ("fichier_path" in fichier) await supabase.storage.from(COURS_BUCKET).remove([fichier.fichier_path as string]);
  }
  check(error);
}

export async function updateCours(c: Cours, input: CoursInput, file: File | null, image?: ImageChoix) {
  const fichier = file ? await upload(file, input.filiere) : {};
  if (!file && !c.fichier_path && !input.video_url.trim()) throw new Error("Ajoutez un fichier ou un lien vidéo.");
  const img = await preparerImage(image, c.image_path, "cours");
  const { error } = await db.from("cours_en_ligne").update({ ...row(input), ...fichier, ...img.patch }).eq("id", c.id);
  if (error) await img.annuler();
  check(error);
  await img.valider();
  if (file && c.fichier_path) await supabase.storage.from(COURS_BUCKET).remove([c.fichier_path]);
}

export async function deleteCours(c: Cours) {
  const { error } = await db.from("cours_en_ligne").delete().eq("id", c.id);
  check(error);
  await supprimerImage(c.image_path);
  if (c.fichier_path) await supabase.storage.from(COURS_BUCKET).remove([c.fichier_path]);
}
