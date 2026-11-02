import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Les tables du marché ne sont pas dans les types générés : client non typé (comme les cours en ligne).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export const MARCHE_BUCKET = "marche-photos";
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIMES = ["image/jpeg", "image/png", "image/webp"];

export const TYPES_ANNONCE = [
  { value: "vente", label: "Je vends", court: "Vente", color: "#0F8A44" },
  { value: "recherche", label: "Je cherche", court: "Recherche", color: "#1d6fa5" },
  { value: "service", label: "Je propose un service", court: "Service", color: "#c2410c" },
  { value: "colocation", label: "Colocation / logement", court: "Colocation", color: "#7c3aed" },
] as const;
export type TypeAnnonce = (typeof TYPES_ANNONCE)[number]["value"];

export const CATEGORIES_MARCHE = ["Livres", "Documents & cours", "Services", "Colocation & logement", "Matériel & autres"] as const;
export type CategorieMarche = (typeof CATEGORIES_MARCHE)[number];

export const MOTIFS = [
  { value: "arnaque", label: "Arnaque ou fausse annonce" },
  { value: "contenu_inapproprie", label: "Contenu inapproprié" },
  { value: "doublon", label: "Annonce en double" },
  { value: "autre", label: "Autre problème" },
] as const;
export type Motif = (typeof MOTIFS)[number]["value"];

export const VILLES_SUGGEREES = ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Ouahigouya", "Fada N'Gourma", "Dédougou", "Banfora", "Dori"];

export type Annonce = {
  id: string;
  user_id: string;
  auteur_nom: string;
  type_annonce: TypeAnnonce;
  categorie: CategorieMarche;
  titre: string;
  description: string;
  prix: number | null;
  ville: string;
  universite: string | null;
  photos: string[];
  statut: "active" | "terminee";
  masquee: boolean;
  a_la_une_jusqu?: string | null;
  created_at: string;
  updated_at: string;
  contact?: string;
};

export type AnnonceInput = {
  type_annonce: TypeAnnonce;
  categorie: CategorieMarche;
  titre: string;
  description: string;
  prix: string; // texte saisi : vide = « à discuter », 0 = « gratuit »
  ville: string;
  universite: string;
  contact: string;
  auteur_nom: string;
};

// Le numéro de contact n'est jamais demandé dans les listes publiques (colonne protégée côté base).
const PUBLIC_COLS = "id,user_id,auteur_nom,type_annonce,categorie,titre,description,prix,ville,universite,photos,statut,masquee,a_la_une_jusqu,created_at,updated_at";

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205", "PGRST202"].includes(error.code ?? "")) throw new Error("Le Marché étudiant n’a pas encore été activé. Contactez l’administrateur.");
  if (error.code === "42501") throw new Error("Vous n’avez pas l’autorisation d’effectuer cette action.");
  if (error.code === "23505") throw new Error("Vous avez déjà signalé cette annonce.");
  if (error.code === "23514") throw new Error("Certaines informations sont invalides, ou vous avez atteint votre limite d’annonces actives (passez Vendeur Pro pour en publier plus).");
  throw new Error("L’opération a échoué. Vérifiez votre connexion puis réessayez.");
}

export function parsePrix(value: string): number | null {
  const digits = value.replace(/[\s.]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isInteger(n) ? n : NaN;
}

export function validateAnnonce(input: AnnonceInput): string | null {
  if (input.auteur_nom.trim().length < 2) return "Indiquez le nom affiché sur l’annonce.";
  if (input.titre.trim().length < 3) return "Le titre doit contenir au moins 3 caractères.";
  if (input.titre.trim().length > 120) return "Le titre est trop long (120 caractères maximum).";
  if (input.description.trim().length < 10) return "Décrivez votre annonce en au moins 10 caractères.";
  if (input.description.trim().length > 3000) return "La description est trop longue (3000 caractères maximum).";
  const prix = parsePrix(input.prix);
  if (prix !== null && (!Number.isFinite(prix) || prix < 0 || prix > 100000000)) return "Prix invalide : saisissez uniquement des chiffres.";
  if (input.ville.trim().length < 2) return "Indiquez la ville.";
  if (!/^[0-9+ ().-]{6,30}$/.test(input.contact.trim())) return "Numéro de contact invalide (chiffres, espaces et + uniquement).";
  if (!TYPES_ANNONCE.some((t) => t.value === input.type_annonce)) return "Type d’annonce invalide.";
  if (!CATEGORIES_MARCHE.includes(input.categorie)) return "Catégorie invalide.";
  return null;
}

export function validatePhoto(file: File): string | null {
  if (!PHOTO_MIMES.includes(file.type)) return "Photo non acceptée : utilisez JPG, PNG ou WebP.";
  if (file.size > 15 * 1024 * 1024) return "Photo trop lourde (15 Mo maximum avant compression).";
  return null;
}

export function formatPrix(prix: number | null, type?: TypeAnnonce): string {
  if (prix === null) return "Prix à discuter";
  if (prix === 0) return "Gratuit";
  const montant = `${prix.toLocaleString("fr-FR")} FCFA`;
  return type === "colocation" ? `${montant} / mois` : type === "service" ? `Dès ${montant}` : montant;
}

export function tempsEcoule(iso: string, now = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l’instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 30) return `Il y a ${j} jour${j > 1 ? "s" : ""}`;
  return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

// Numéros burkinabè à 8 chiffres : on ajoute l'indicatif +226 pour WhatsApp.
export function whatsappLink(contact: string, titre: string): string {
  let digits = contact.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.length === 8) digits = `226${digits}`;
  const text = encodeURIComponent(`Bonjour, je suis intéressé(e) par votre annonce « ${titre} » sur CampusLink.`);
  return `https://wa.me/${digits}?text=${text}`;
}
export function telLink(contact: string): string {
  return `tel:${contact.replace(/[^\d+]/g, "")}`;
}

export function photoUrl(path: string): string {
  return supabase.storage.from(MARCHE_BUCKET).getPublicUrl(path).data.publicUrl;
}

// Réduit les photos de téléphone (souvent 5 à 10 Mo) avant l'envoi : économise les données mobiles.
async function compresser(file: File): Promise<File> {
  try {
    if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
    const bitmap = await createImageBitmap(file);
    const echelle = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function envoyerPhotos(userId: string, files: File[]): Promise<string[]> {
  const chemins: string[] = [];
  try {
    for (const original of files.slice(0, MAX_PHOTOS)) {
      const probleme = validatePhoto(original);
      if (probleme) throw new Error(probleme);
      const file = await compresser(original);
      if (file.size > MAX_PHOTO_BYTES) throw new Error("Une photo reste trop lourde (5 Mo maximum).");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(MARCHE_BUCKET).upload(path, file, { contentType: file.type });
      if (error) throw new Error("L’envoi d’une photo a échoué. Vérifiez votre connexion puis réessayez.");
      chemins.push(path);
    }
    return chemins;
  } catch (err) {
    if (chemins.length) await supabase.storage.from(MARCHE_BUCKET).remove(chemins);
    throw err;
  }
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listAnnonces(): Promise<Annonce[]> {
  const { data, error } = await db.from("marche_annonces").select(PUBLIC_COLS).eq("statut", "active").eq("masquee", false).order("created_at", { ascending: false }).limit(300);
  check(error);
  return (data ?? []) as Annonce[];
}

export async function mesAnnonces(): Promise<Annonce[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await db.from("marche_annonces").select(PUBLIC_COLS).eq("user_id", userId).order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Annonce[];
}

// Réservé aux personnes connectées (la base refuse la colonne « contact » aux visiteurs anonymes).
export async function getContact(id: string): Promise<string> {
  const { data, error } = await db.from("marche_annonces").select("contact").eq("id", id).single();
  check(error);
  return (data as { contact: string }).contact;
}

export async function createAnnonce(input: AnnonceInput, files: File[]) {
  const probleme = validateAnnonce(input);
  if (probleme) throw new Error(probleme);
  const userId = await currentUserId();
  if (!userId) throw new Error("Reconnectez-vous pour publier une annonce.");
  const photos = await envoyerPhotos(userId, files);
  const prix = parsePrix(input.prix);
  const { error } = await db.from("marche_annonces").insert({
    user_id: userId,
    auteur_nom: input.auteur_nom.trim(),
    type_annonce: input.type_annonce,
    categorie: input.categorie,
    titre: input.titre.trim(),
    description: input.description.trim(),
    prix,
    ville: input.ville.trim(),
    universite: input.universite.trim() || null,
    contact: input.contact.trim(),
    photos,
  });
  if (error && photos.length) await supabase.storage.from(MARCHE_BUCKET).remove(photos);
  check(error);
}

export async function setStatut(id: string, statut: "active" | "terminee") {
  const { data, error } = await db.from("marche_annonces").update({ statut }).eq("id", id).select("id").single();
  check(error);
  if (!data) throw new Error("L’annonce n’a pas été mise à jour.");
}

export async function deleteAnnonce(a: Pick<Annonce, "id" | "photos">) {
  const { error } = await db.from("marche_annonces").delete().eq("id", a.id);
  check(error);
  if (a.photos.length) await supabase.storage.from(MARCHE_BUCKET).remove(a.photos);
}

export async function signaler(annonceId: string, motif: Motif, details: string) {
  const { error } = await db.from("marche_signalements").insert({ annonce_id: annonceId, motif, details: details.trim().slice(0, 500) || null });
  check(error);
}

/* ---------- Modération (super administrateur) ---------- */
export type Signalement = { id: string; annonce_id: string; motif: Motif; details: string | null; created_at: string };

export async function listAnnoncesModeration(): Promise<Annonce[]> {
  const { data, error } = await db.from("marche_annonces").select(`${PUBLIC_COLS},contact`).order("created_at", { ascending: false }).limit(500);
  check(error);
  return (data ?? []) as Annonce[];
}
export async function listSignalements(): Promise<Signalement[]> {
  const { data, error } = await db.from("marche_signalements").select("*").order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Signalement[];
}
export async function moderer(id: string, masquer: boolean) {
  const { error } = await db.rpc("marche_moderer", { p_id: id, p_masquer: masquer });
  check(error);
}
