// Monétisation du Marché étudiant : « À la une », bannières locales, abonnement Vendeur Pro.
// Paiement manuel Orange Money / Moov Money ; le super administrateur vérifie puis active.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;
export const BANNIERES_BUCKET = "marche-bannieres";

export type Tarifs = {
  une_semaine: number;
  une_mois: number;
  banniere_semaine: number;
  banniere_mois: number;
  pro_mois: number;
  pro_max_annonces: number;
  numero_orange: string;
  numero_moov: string;
  nom_beneficiaire: string;
};
export type Banniere = {
  id: string;
  annonceur: string;
  message: string;
  telephone: string | null;
  lien: string | null;
  image_path: string | null;
  debut: string;
  fin: string;
  actif: boolean;
};
export type Paiement = {
  id: string;
  user_id: string;
  type_offre: "une" | "pro";
  duree: "semaine" | "mois";
  annonce_id: string | null;
  montant: number;
  operateur: "orange" | "moov";
  telephone_payeur: string;
  reference: string;
  statut: "en_attente" | "validee" | "refusee";
  created_at: string;
};

function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (["42P01", "PGRST205", "PGRST202"].includes(error.code ?? "")) throw new Error("Cette fonctionnalité n’est pas encore activée. Contactez l’administrateur.");
  if (error.code === "42501") throw new Error("Vous n’avez pas l’autorisation d’effectuer cette action.");
  if (error.code === "23514") throw new Error("Certaines informations sont invalides.");
  throw new Error("L’opération a échoué. Vérifiez votre connexion puis réessayez.");
}

export const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export function estActif(jusqu: string | null | undefined, now = new Date()): boolean {
  return Boolean(jusqu && new Date(jusqu).getTime() > now.getTime());
}

// Annonces à la une d'abord (les plus récentes en premier), puis les autres dans l'ordre reçu.
export function trierALaUne<T extends { a_la_une_jusqu?: string | null; created_at: string }>(liste: T[], now = new Date()): T[] {
  const une = liste.filter((a) => estActif(a.a_la_une_jusqu, now));
  const autres = liste.filter((a) => !estActif(a.a_la_une_jusqu, now));
  return [...une, ...autres];
}

export function montantOffre(t: Tarifs, offre: "une" | "pro", duree: "semaine" | "mois"): number {
  if (offre === "pro") return t.pro_mois;
  return duree === "semaine" ? t.une_semaine : t.une_mois;
}

export async function getTarifs(): Promise<Tarifs> {
  const { data, error } = await db.from("marche_tarifs").select("*").eq("id", 1).single();
  check(error);
  return data as Tarifs;
}
export async function saveTarifs(t: Tarifs) {
  const { error } = await db.from("marche_tarifs").update({ ...t, updated_at: new Date().toISOString() }).eq("id", 1);
  check(error);
}

export async function listProsActifs(): Promise<Set<string>> {
  const { data, error } = await db.from("marche_pros").select("user_id,actif_jusqu").gt("actif_jusqu", new Date().toISOString());
  if (error) return new Set();
  return new Set((data ?? []).map((r: { user_id: string }) => r.user_id));
}

export async function demanderPaiement(input: {
  type_offre: "une" | "pro";
  duree: "semaine" | "mois";
  annonce_id: string | null;
  operateur: "orange" | "moov";
  telephone_payeur: string;
  reference: string;
}) {
  if (!/^[0-9+ ().-]{6,30}$/.test(input.telephone_payeur.trim())) throw new Error("Numéro utilisé pour payer invalide.");
  if (input.reference.trim().length < 3) throw new Error("Indiquez la référence (ID) de la transaction reçue par SMS.");
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Reconnectez-vous.");
  const { error } = await db.from("marche_paiements").insert({
    ...input,
    user_id: u.user.id,
    telephone_payeur: input.telephone_payeur.trim(),
    reference: input.reference.trim(),
    montant: 0, // recalculé par la base à partir des tarifs
  });
  check(error);
}
export async function mesPaiements(): Promise<Paiement[]> {
  const { data, error } = await db.from("marche_paiements").select("*").order("created_at", { ascending: false }).limit(50);
  check(error);
  return (data ?? []) as Paiement[];
}
export async function listPaiementsAdmin(): Promise<Paiement[]> {
  const { data, error } = await db.from("marche_paiements").select("*").order("created_at", { ascending: false }).limit(300);
  check(error);
  return (data ?? []) as Paiement[];
}
export async function traiterPaiement(id: string, valider: boolean) {
  const { error } = await db.rpc("marche_traiter_paiement", { p_id: id, p_valider: valider });
  check(error);
}

/* ---------- Bannières ---------- */
export function banniereImage(path: string): string {
  return supabase.storage.from(BANNIERES_BUCKET).getPublicUrl(path).data.publicUrl;
}
export async function listBannieresActives(): Promise<Banniere[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db.from("marche_bannieres").select("*").eq("actif", true).lte("debut", today).gte("fin", today).order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Banniere[];
}
export async function listBannieresAdmin(): Promise<Banniere[]> {
  const { data, error } = await db.from("marche_bannieres").select("*").order("created_at", { ascending: false });
  check(error);
  return (data ?? []) as Banniere[];
}
export async function creerBanniere(input: Omit<Banniere, "id" | "image_path" | "actif">, image: File | null) {
  let image_path: string | null = null;
  if (image) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new Error("Image : JPG, PNG ou WebP uniquement.");
    if (image.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (5 Mo maximum).");
    image_path = `${crypto.randomUUID()}.${image.type.split("/")[1]}`;
    const { error } = await supabase.storage.from(BANNIERES_BUCKET).upload(image_path, image, { contentType: image.type });
    if (error) throw new Error("L’envoi de l’image a échoué.");
  }
  const { error } = await db.from("marche_bannieres").insert({
    annonceur: input.annonceur.trim(),
    message: input.message.trim(),
    telephone: input.telephone?.trim() || null,
    lien: input.lien?.trim() || null,
    debut: input.debut,
    fin: input.fin,
    image_path,
  });
  if (error && image_path) await supabase.storage.from(BANNIERES_BUCKET).remove([image_path]);
  check(error);
}
export async function basculerBanniere(id: string, actif: boolean) {
  const { error } = await db.from("marche_bannieres").update({ actif }).eq("id", id);
  check(error);
}
export async function supprimerBanniere(b: Banniere) {
  const { error } = await db.from("marche_bannieres").delete().eq("id", b.id);
  check(error);
  if (b.image_path) await supabase.storage.from(BANNIERES_BUCKET).remove([b.image_path]);
}
