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

// Mot de passe : 6 caractères minimum + une minuscule + une MAJUSCULE + un chiffre.
// Le message dit précisément ce qui manque (et pas seulement « mot de passe invalide »).
export const REGLE_MOT_DE_PASSE = "Au moins 6 caractères, avec une majuscule, une minuscule et un chiffre.";

export function validerMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  const manque: string[] = [];
  if (!/[a-z]/.test(motDePasse)) manque.push("une lettre minuscule");
  if (!/[A-Z]/.test(motDePasse)) manque.push("une lettre MAJUSCULE");
  if (!/[0-9]/.test(motDePasse)) manque.push("un chiffre");
  if (manque.length === 0) return null;
  const liste = manque.length === 1 ? manque[0] : `${manque.slice(0, -1).join(", ")} et ${manque[manque.length - 1]}`;
  return `Il manque dans ton mot de passe : ${liste}.`;
}

// Email de récupération : facultatif. Vide = accepté.
export function normaliserEmail(saisie: string): string {
  return saisie.trim().toLowerCase();
}

export function validerEmailOptionnel(saisie: string): string | null {
  const e = normaliserEmail(saisie);
  if (!e) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) || e.endsWith(`@${DOMAINE_MEMBRE}`)) return "Adresse email de récupération invalide.";
  return null;
}

export function validerInscription(nom: string, telephone: string, motDePasse: string, email = ""): string | null {
  if (nom.trim().length < 2 || nom.trim().length > 60) return "Le nom de profil doit contenir entre 2 et 60 caractères.";
  const tel = normaliserTelephone(telephone);
  if (tel.length < 8 || tel.length > 15) return "Numéro de téléphone invalide.";
  return validerMotDePasse(motDePasse) ?? validerEmailOptionnel(email);
}

export async function connecterMembre(telephone: string, motDePasse: string) { {
    console.error("[connecterMembre]", error.message);
    if (/email not confirmed/i.test(error.message)) {
      throw new Error("Ton compte n'est pas encore activé. Contacte l'administrateur de CampusLink.");
    }
    if (/failed to fetch|network/i.test(error.message)) {
      throw new Error("Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.");
    }
    throw new Error("Numéro ou mot de passe incorrect.");
  }
}

// Inscription « de secours » faite directement depuis le navigateur, sans passer par le serveur
// (utile si la clé SUPABASE_SERVICE_ROLE_KEY est absente ou si la fonction serveur est indisponible).
// Elle s'appuie sur le déclencheur SQL de 20261105000000_fix_inscription_primaire.sql
// qui confirme automatiquement les comptes membres et crée leur profil.
export const EMAIL_REFUSE = "EMAIL_REFUSE";

export async function inscrireMembreDirect(nom: string, telephone: string, motDePasse: string, email = ""): Promise<void> {
  const emailRec = normaliserEmail(email);
  const tel = normaliserTelephone(telephone);
  const email = emailMembre(tel);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { nom_profil: nom.trim(), telephone: tel, type_compte: "membre", ...(emailRec ? { email_recuperation: emailRec } : {}) } },
  });
  if (error) {
    console.error("[inscrireMembreDirect]", error.message);
    if (/already|registered|exists/i.test(error.message)) throw new Error("Ce numéro est déjà inscrit. Connectez-vous.");
    if (/password/i.test(error.message)) throw new Error(validerMotDePasse(motDePasse) ?? `Mot de passe refusé. ${REGLE_MOT_DE_PASSE}`);
    if (/signups? (not allowed|are disabled)|disabled/i.test(error.message)) throw new Error("Les inscriptions sont momentanément fermées. Réessaie plus tard.");
    if (/rate limit|too many/i.test(error.message)) throw new Error("Trop de tentatives. Patiente quelques minutes avant de réessayer.");
    if (/failed to fetch|network/i.test(error.message)) throw new Error("Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.");
    if (/invalid/i.test(error.message) && /email/i.test(error.message)) throw new Error(EMAIL_REFUSE);
    throw new Error("Inscription impossible pour le moment. Réessaie dans quelques instants.");
  }
  // Un compte déjà existant renvoie parfois un utilisateur « vide » sans erreur.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("Ce numéro est déjà inscrit. Connectez-vous.");
  }
  // Pas de session = le compte n'a pas été confirmé automatiquement.
  if (!data.session) await connecterMembre(tel, motDePasse);
  // Profil : normalement créé par le déclencheur SQL ; sinon on le crée ici (sans bloquer).
  if (data.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errProfil } = await (supabase as any)
      .from("membres")
      .upsert({ user_id: data.user.id, nom_profil: nom.trim(), telephone: tel, ...(emailRec ? { email_recuperation: emailRec } : {}) }, { onConflict: "user_id" });
    if (errProfil) console.error("[inscrireMembreDirect] profil :", errProfil.message);
  }
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
