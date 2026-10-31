import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export type VisitePage = "site" | "revision-ia" | "opportunites" | "bibliotheque" | "installation";

// Identifiant anonyme propre à l'appareil/navigateur : un même téléphone n'est compté qu'une fois par période.
function visitorId(): string {
  try {
    let id = localStorage.getItem("cl_vid");
    if (!id || id.length < 8) {
      id = crypto.randomUUID();
      localStorage.setItem("cl_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

// once = "session" : une seule fois par session ; "device" : une seule fois sur cet appareil.
export function trackVisit(page: VisitePage, once: "session" | "device" = "session") {
  try {
    const id = visitorId();
    if (!id) return;
    const store = once === "device" ? localStorage : sessionStorage;
    const key = `cl_seen_${page}`;
    if (store.getItem(key)) return;
    store.setItem(key, "1");
    void db.from("visites").insert({ visitor_id: id, page }).then(() => undefined);
  } catch {
    /* le suivi ne doit jamais gêner l'utilisateur */
  }
}

export type StatsPoint = { periode: string; visiteurs: number };
export type Stats = {
  depuis: string | null;
  total: number;
  aujourdhui: number;
  sept_jours: number;
  trente_jours: number;
  installations: number;
  outils: { page: string; total: number; sept_jours: number; trente_jours: number }[];
  par_jour: StatsPoint[];
  par_semaine: StatsPoint[];
  par_mois: StatsPoint[];
};

export async function fetchStats(): Promise<Stats> {
  const { data, error } = await db.rpc("stats_visiteurs");
  if (error) {
    if (["42883", "PGRST202", "42P01"].includes(error.code ?? "")) throw new Error("Le comptage des visiteurs n’est pas encore activé : exécutez le SQL n°2 dans Supabase.");
    if (error.code === "42501") throw new Error("Accès réservé au super administrateur.");
    throw new Error("Impossible de charger les statistiques.");
  }
  return data as Stats;
}
