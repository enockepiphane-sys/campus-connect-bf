import { supabase } from "@/integrations/supabase/client";

// Les tables « avis_plateforme » et « notifications_plateforme » sont créées par la migration
// 20261114000000_avis_et_notifications_plateforme.sql ; elles ne figurent pas encore dans types.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export type Avis = {
  id: string;
  user_id: string;
  nom_affiche: string;
  note: number;
  commentaire: string | null;
  reponse: string | null;
  reponse_le: string | null;
  reponse_lue: boolean;
  created_at: string;
  updated_at: string;
};

export type NotifPlateforme = { id: string; titre: string; message: string; lien: string | null; created_at: string };

export const LIBELLES_NOTE = ["", "Décevant", "Moyen", "Correct", "Très bien", "Excellent"];

/** Nom d'affichage du membre connecté (nom de profil de l'inscription primaire). */
export async function nomMembre(userId: string): Promise<string> {
  const { data } = await db.from("membres").select("nom_profil").eq("user_id", userId).maybeSingle();
  return (data?.nom_profil as string | undefined) ?? "Membre";
}

export async function monAvis(userId: string): Promise<Avis | null> {
  const { data } = await db.from("avis_plateforme").select("*").eq("user_id", userId).maybeSingle();
  return (data as Avis | null) ?? null;
}

export async function statistiquesAvis(): Promise<{ moyenne: number; total: number }> {
  const { data } = await db.rpc("avis_statistiques");
  const l = Array.isArray(data) ? data[0] : data;
  return { moyenne: Number(l?.moyenne ?? 0), total: Number(l?.total ?? 0) };
}

/** Enregistre (ou met à jour) l'avis du membre connecté. Renvoie un message d'erreur, ou null si tout va bien. */
export async function envoyerAvis(userId: string, note: number, commentaire: string): Promise<string | null> {
  const nom = await nomMembre(userId);
  const { error } = await db
    .from("avis_plateforme")
    .upsert(
      { user_id: userId, nom_affiche: nom, note, commentaire: commentaire.trim() || null },
      { onConflict: "user_id" },
    );
  if (error) return "Impossible d’enregistrer ton avis pour le moment. Réessaie.";
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cl-avis-change"));
  return null;
}

// ───────── Rappel « Noter l'application » : on repropose après « Plus tard » ─────────
const CLE_RAPPEL = "cl-avis-rappel";
const DELAI_RAPPEL_MS = 3 * 24 * 3600 * 1000; // revient 3 jours après « Plus tard »

export function rappelAvisDu(): boolean {
  try {
    const t = Number(localStorage.getItem(CLE_RAPPEL) ?? 0);
    return !t || Date.now() - t > DELAI_RAPPEL_MS;
  } catch {
    return true;
  }
}
export function reporterRappelAvis() {
  try { localStorage.setItem(CLE_RAPPEL, String(Date.now())); } catch { /* stockage indisponible */ }
}
