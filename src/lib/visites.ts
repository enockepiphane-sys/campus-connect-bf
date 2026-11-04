import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

export type VisitePage = "site" | "revision-ia" | "opportunites" | "bibliotheque" | "installation";

/* ---------- Filtres : robots et appareils à ne pas compter ---------- */

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|vercel|screenshot|preview|facebookexternalhit|whatsapp\/|telegrambot|python|curl|wget|httpclient|node-fetch|axios/i;
const NO_TRACK_KEY = "cl_no_track";

function isAutomated() {
  try {
    return navigator.webdriver === true || BOT.test(navigator.userAgent);
  } catch {
    return false;
  }
}
export function isNoTrack() {
  try {
    return localStorage.getItem(NO_TRACK_KEY) === "1";
  } catch {
    return false;
  }
}
export function setNoTrack(on: boolean) {
  try {
    if (on) localStorage.setItem(NO_TRACK_KEY, "1");
    else localStorage.removeItem(NO_TRACK_KEY);
  } catch {
    /* stockage indisponible */
  }
}

// Décrit un appareil à partir de son « user agent » (pour reconnaître les robots et les tests).
export function describeAgent(ua: string | null): { label: string; bot: boolean } {
  if (!ua) return { label: "Inconnu (visite ancienne)", bot: false };
  if (BOT.test(ua)) return { label: "Robot / automatique", bot: true };
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iPhone / iPad" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : /linux/i.test(ua) ? "Linux" : "Autre";
  const nav = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /samsungbrowser/i.test(ua) ? "Samsung" : /firefox/i.test(ua) ? "Firefox" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Navigateur";
  const app = /fban|fbav|instagram/i.test(ua) ? " (Facebook)" : /; wv\)/.test(ua) ? " (dans une appli)" : "";
  return { label: `${os} · ${nav}${app}`, bot: false };
}

/* ---------- Enregistrement des visites ---------- */

// Seules les personnes connectées (compte primaire ouvert au minimum) sont comptées.
// Un utilisateur = un compte : le même compte sur plusieurs appareils n'est compté qu'une fois.
// once = "session" : une seule fois par session ; "device" : une seule fois sur cet appareil.
export function trackVisit(page: VisitePage, once: "session" | "device" = "session") {
  try {
    if (isAutomated() || isNoTrack()) return;
    void supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id;
      if (!userId) return; // visiteur sans compte : non compté
      const store = once === "device" ? localStorage : sessionStorage;
      const key = `cl_seen_${page}_${userId}`;
      if (store.getItem(key)) return;
      store.setItem(key, "1");
      const agent = navigator.userAgent.slice(0, 300);
      return db
        .from("visites")
        .insert({ visitor_id: userId, user_id: userId, page, agent })
        .then(({ error }: { error: { code?: string } | null }) => {
          if (error) store.removeItem(key); // nouvel essai à la prochaine page
        });
    }).catch(() => undefined);
  } catch {
    /* le suivi ne doit jamais gêner l'utilisateur */
  }
}

/* ---------- Statistiques (super administrateur) ---------- */

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
export type VisitorRow = { visiteur: string; premiere: string; derniere: string; actions: number; agent: string | null };

function rpcError(error: { code?: string }, missing: string): never {
  if (["42883", "PGRST202", "42P01"].includes(error.code ?? "")) throw new Error(missing);
  if (error.code === "42501") throw new Error("Accès réservé au super administrateur.");
  throw new Error("L’opération a échoué. Réessayez.");
}

export async function fetchStats(): Promise<Stats> {
  const { data, error } = await db.rpc("stats_visiteurs");
  if (error) rpcError(error, "Le comptage des visiteurs n’est pas encore activé : exécutez le SQL n°2 dans Supabase.");
  return data as Stats;
}

export async function fetchDetail(): Promise<VisitorRow[]> {
  const { data, error } = await db.rpc("visiteurs_detail");
  if (error) rpcError(error, "Le détail des visiteurs n’est pas encore activé : exécutez le SQL n°3 dans Supabase.");
  return (data ?? []) as VisitorRow[];
}

export async function resetVisits() {
  const { error } = await db.rpc("visites_remise_a_zero");
  if (error) rpcError(error, "La remise à zéro n’est pas encore activée : exécutez le SQL n°3 dans Supabase.");
}
