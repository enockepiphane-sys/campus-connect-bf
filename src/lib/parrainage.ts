// Parrainage CampusLink : lien personnel, récompenses et contrôle des téléchargements.
// Les règles (3 → 1, 5 → +3, 10 → +6 + badge Ambassadeur, 20 → Super Ambassadeur illimité) et l'anti-fraude
// sont appliquées côté base de données (migration 20261110000000_parrainage.sql).
// Ici : simples appels + mémorisation du code parrain et de l'identifiant d'appareil.
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const PALIERS = [
  { seuil: 3, titre: "1 téléchargement débloqué" },
  { seuil: 5, titre: "+3 téléchargements (4 au total)" },
  { seuil: 10, titre: "+6 téléchargements (10 au total) + badge Ambassadeur CampusLink" },
  { seuil: 20, titre: "Super Ambassadeur CampusLink : téléchargements illimités" },
] as const;

export type MonParrainage = {
  code: string;
  valides: number;
  en_attente: number;
  rejetes: number;
  credits: number;
  utilises: number;
  restants: number;
  ambassadeur: boolean;
  super_ambassadeur?: boolean;
  illimite: boolean;
};

export type LigneClassement = { rang: number; nom: string; valides: number; ambassadeur: boolean; super_ambassadeur?: boolean; moi: boolean };

export type ResultatTelechargement =
  | { ok: true; deja?: boolean; restants?: number; illimite?: boolean }
  | { ok: false; raison: "connexion" | "quota" | "ressource" | "erreur"; valides?: number };

const CLE_APPAREIL = "cl_appareil";
const CLE_REF = "cl_parrain_ref";
const CLE_ACTIVITE = "cl_parrainage_activite";
const DUREE_REF = 30 * 24 * 3600 * 1000; // le lien reste mémorisé 30 jours

function stockage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

// Identifiant anonyme de l'appareil (sert uniquement à repérer les auto-inscriptions).
export function appareilId(): string {
  const s = stockage();
  let id = s?.getItem(CLE_APPAREIL) ?? "";
  if (!/^[a-z0-9-]{8,64}$/i.test(id)) {
    id = crypto.randomUUID();
    s?.setItem(CLE_APPAREIL, id);
  }
  return id;
}

export function normaliserCode(v: unknown): string {
  return typeof v === "string" ? v.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) : "";
}

export function memoriserRef(code: unknown) {
  const c = normaliserCode(code);
  if (c.length < 6) return;
  stockage()?.setItem(CLE_REF, JSON.stringify({ c, t: Date.now() }));
}

export function lireRef(): string {
  try {
    const brut = stockage()?.getItem(CLE_REF);
    if (!brut) return "";
    const { c, t } = JSON.parse(brut) as { c: string; t: number };
    if (Date.now() - t > DUREE_REF) return "";
    return normaliserCode(c);
  } catch {
    return "";
  }
}

export function oublierRef() {
  stockage()?.removeItem(CLE_REF);
}

// Métadonnées ajoutées au compte lors de l'inscription.
export function metadonneesParrainage(): Record<string, string> {
  const ref = lireRef();
  return { appareil: appareilId(), ...(ref ? { parrain_code: ref } : {}) };
}

export function lienParrainage(code: string) {
  return `${getSiteUrl()}/inscription?ref=${encodeURIComponent(code)}`;
}

export async function getMonParrainage(): Promise<MonParrainage> {
  const { data, error } = await db.rpc("mon_parrainage");
  if (error) throw new Error("Impossible de charger ton parrainage. Vérifie ta connexion puis réessaie.");
  return data as MonParrainage;
}

export async function getClassement(limite = 20): Promise<LigneClassement[]> {
  const { data, error } = await db.rpc("classement_parrains", { _limite: limite });
  if (error) throw new Error("Impossible de charger le classement.");
  return (data ?? []) as LigneClassement[];
}

export async function consommerTelechargement(ressource: string): Promise<ResultatTelechargement> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { ok: false, raison: "connexion" };
  const { data, error } = await db.rpc("consommer_telechargement", { _ressource: ressource });
  if (error || !data) return { ok: false, raison: "erreur" };
  return data as ResultatTelechargement;
}

// Signale que l'utilisateur est actif (validation des filleuls après 24 h). Au plus une fois par heure.
export async function signalerActivite() {
  const s = stockage();
  const dernier = Number(s?.getItem(CLE_ACTIVITE) ?? 0);
  if (Date.now() - dernier < 3600 * 1000) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await db.rpc("parrainage_signaler_activite", { _appareil: appareilId() });
  if (!error) s?.setItem(CLE_ACTIVITE, String(Date.now()));
}

// Prochain palier à atteindre (null quand tout est débloqué).
export function prochainPalier(valides: number) {
  return PALIERS.find((p) => valides < p.seuil) ?? null;
}
