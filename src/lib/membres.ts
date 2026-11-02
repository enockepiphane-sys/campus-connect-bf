// Inscription PRIMAIRE CampusLink (nom de profil + téléphone + mot de passe).
// Elle donne accès aux fonctionnalités de l'accueil (bibliothèque, marché, opportunités…)
// et reste totalement séparée de l'inscription universités / étudiants pré-inscrits.
import { supabase } from "@/integrations/supabase/client";

export const DOMAINE_MEMBRE = "membre.campuslink.bf";

// 8 chiffres burkinabè → on ajoute 226. Sinon on garde les chiffres saisis.
export function normaliserTelephone(saisie: string): string {
  let d = saisie.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 8) d = `226${d}`;
  return d;
}

export function emailMembre(telephone: string): string {
  return `${normaliserTelephone(telephone)}@${DOMAINE_MEMBRE}`;
}

export function validerInscription(nom: string, telephone: string, motDePasse: string): string | null {
  if (nom.trim().length < 2 || nom.trim().length > 60) return "Le nom de profil doit contenir entre 2 et 60 caractères.";
  const tel = normaliserTelephone(telephone);
  if (tel.length < 8 || tel.length > 15) return "Numéro de téléphone invalide.";
  if (motDePasse.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  return null;
}

export async function connecterMembre(telephone: string, motDePasse: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: emailMembre(telephone), password: motDePasse });
  if (error) throw new Error("Numéro ou mot de passe incorrect.");
}

// Toute session existante (membre, étudiant, admin) ouvre les fonctionnalités primaires.
export async function aUneSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

// Chemin interne uniquement (évite les redirections vers un autre site).
export function retourSur(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
