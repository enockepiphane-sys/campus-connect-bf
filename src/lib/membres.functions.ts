import { createServerFn } from "@tanstack/react-start";
import { emailMembre, normaliserEmail, normaliserTelephone, validerInscription, validerMotDePasse } from "./membres";

// Fonctions serveur de l'inscription PRIMAIRE uniquement (table « membres »).
// Elles ne touchent jamais aux comptes étudiants / administrateurs (inscription secondaire).
// NB : pas de .validator()/.inputValidator() (nom variable selon les versions) : on valide dans le handler.

type Resultat = { ok: true; message?: string } | { ok: false; message: string; secours: boolean };
type Ctx = { data?: Record<string, unknown> };

const lire = (ctx: unknown): Record<string, unknown> => ((ctx as Ctx).data ?? {}) as Record<string, unknown>;

// Messages et réponses réutilisés (évite les doublons).
const MSG_DEJA_INSCRIT = "Ce numéro est déjà inscrit. Connectez-vous.";
const MSG_MDP_REFUSE = "Mot de passe refusé. Au moins 6 caractères, avec une majuscule, une minuscule et un chiffre.";
const MSG_INSCRIPTION_IMPOSSIBLE = "Inscription impossible pour le moment.";
const MSG_INDISPONIBLE = "Service indisponible pour le moment. Réessaie plus tard.";
const refus = (message: string, secours = false): Resultat => ({ ok: false, message, secours });

async function sha256(texte: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as any;
}

// ───────────── Inscription (voie de secours côté serveur) ─────────────
export const inscrireMembre = createServerFn({ method: "POST" }).handler(async (ctx): Promise<Resultat> => {
  try {
    const brut = lire(ctx);
    const nom = String(brut.nom ?? "").trim();
    const telephone = normaliserTelephone(String(brut.telephone ?? ""));
    const motDePasse = String(brut.motDePasse ?? "");
    const email = normaliserEmail(String(brut.email ?? ""));
    const probleme = validerInscription(nom, telephone, motDePasse, email);
    if (probleme) return { ok: false, message: probleme, secours: false };
    // Parrainage (facultatif) : code parrain + identifiant d'appareil, contrôlés ensuite en base.
    const parrainCode = String(brut.parrain_code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const appareil = String(brut.appareil ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
    const parrainage = { ...(parrainCode.length >= 6 ? { parrain_code: parrainCode } : {}), ...(appareil.length >= 8 ? { appareil } : {}) };

    const db = await admin();
    const { data: existant } = await db.from("membres").select("user_id").eq("telephone", telephone).maybeSingle();
    if (existant) return refus(MSG_DEJA_INSCRIT);

    const { data: cree, error } = await db.auth.admin.createUser({
      email: emailMembre(telephone),
      password: motDePasse,
      email_confirm: true,
      user_metadata: { nom_profil: nom, telephone, type_compte: "membre", ...(email ? { email_recuperation: email } : {}), ...parrainage },
    });
    if (error || !cree?.user) {
      const msg = String(error?.message ?? "");
      console.error("[inscrireMembre] createUser :", msg);
      if (/already|registered|exists/i.test(msg)) return refus(MSG_DEJA_INSCRIT);
      if (/password/i.test(msg)) return refus(MSG_MDP_REFUSE);
      return refus(MSG_INSCRIPTION_IMPOSSIBLE, true);
    }
    const { error: errProfil } = await db
      .from("membres")
      .upsert({ user_id: cree.user.id, nom_profil: nom, telephone, ...(email ? { email_recuperation: email } : {}) }, { onConflict: "user_id" });
    if (errProfil) {
      // Sans ligne « membres », le compte serait orphelin (connexion/réinitialisation impossibles) : on l'annule pour permettre un nouvel essai.
      console.error("[inscrireMembre] profil non enregistré :", errProfil.message);
      await db.auth.admin.deleteUser(cree.user.id).catch((e: unknown) => console.error("[inscrireMembre] annulation du compte :", e));
      return refus(MSG_INSCRIPTION_IMPOSSIBLE, true);
    }
    return { ok: true };
  } catch (e) {
    console.error("[inscrireMembre] erreur serveur :", e);
    return refus(MSG_INSCRIPTION_IMPOSSIBLE, true);
  }
});

// ───────────── Mot de passe oublié : envoi d'un code par email ─────────────
async function envoyerEmail(a: string, nom: string, code: string): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY;
  const de = process.env.MAIL_FROM || "CampusLink <onboarding@resend.dev>";
  if (!cle) {
    console.error("[reinit] RESEND_API_KEY manquante");
    return false;
  }
  const rep = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: de,
      to: [a],
      subject: "Ton code de réinitialisation CampusLink",
      html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:16px">
        <h2 style="color:#0b6b36">CampusLink</h2>
        <p>Bonjour ${nom.replace(/[<>&]/g, "")},</p>
        <p>Voici ton code pour choisir un nouveau mot de passe :</p>
        <p style="font-size:32px;letter-spacing:6px;font-weight:bold">${code}</p>
        <p style="color:#555">Il est valable 15 minutes. Si tu n'as rien demandé, ignore ce message.</p></div>`,
    }),
  });
  if (!rep.ok) console.error("[reinit] Resend :", rep.status, await rep.text().catch(() => ""));
  return rep.ok;
}

export const demanderCodeReinit = createServerFn({ method: "POST" }).handler(async (ctx): Promise<Resultat> => {
  try {
    const telephone = normaliserTelephone(String(lire(ctx).telephone ?? ""));
    if (telephone.length < 8 || telephone.length > 15) return { ok: false, message: "Numéro de téléphone invalide.", secours: false };
    const db = await admin();
    const { data: membre } = await db.from("membres").select("user_id,nom_profil,email_recuperation").eq("telephone", telephone).maybeSingle();
    const neutre = "Si un email de récupération est enregistré pour ce numéro, un code vient d'y être envoyé (valable 15 minutes).";
    if (!membre) return { ok: true, message: neutre };
    if (!membre.email_recuperation) {
      return { ok: false, message: "Aucun email de récupération n'est enregistré sur ce compte. Contacte l'Aide & Support.", secours: false };
    }
    const { data: ancien } = await db.from("membres_reinit").select("cree_le").eq("user_id", membre.user_id).maybeSingle();
    if (ancien && Date.now() - new Date(ancien.cree_le).getTime() < 60_000) {
      return { ok: false, message: "Patiente une minute avant de redemander un code.", secours: false };
    }
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
    const { error } = await db.from("membres_reinit").upsert({
      user_id: membre.user_id,
      code_hash: await sha256(`${membre.user_id}:${code}`),
      expire_le: new Date(Date.now() + 15 * 60_000).toISOString(),
      essais: 0,
      cree_le: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      console.error("[reinit] stockage :", error.message);
      return refus(MSG_INDISPONIBLE);
    }
    const envoye = await envoyerEmail(String(membre.email_recuperation), String(membre.nom_profil ?? ""), code);
    if (!envoye) return { ok: false, message: "L'email n'a pas pu être envoyé. Réessaie plus tard.", secours: false };
    return { ok: true, message: neutre };
  } catch (e) {
    console.error("[demanderCodeReinit]", e);
    return refus(MSG_INDISPONIBLE);
  }
});

export const reinitialiserMotDePasse = createServerFn({ method: "POST" }).handler(async (ctx): Promise<Resultat> => {
  try {
    const brut = lire(ctx);
    const telephone = normaliserTelephone(String(brut.telephone ?? ""));
    const code = String(brut.code ?? "").replace(/\D/g, "");
    const nouveau = String(brut.motDePasse ?? "");
    const probleme = validerMotDePasse(nouveau);
    if (probleme) return { ok: false, message: probleme, secours: false };
    if (code.length !== 6) return { ok: false, message: "Le code contient 6 chiffres.", secours: false };

    const db = await admin();
    const invalide = { ok: false as const, message: "Code incorrect ou expiré. Redemande un code.", secours: false };
    const { data: membre } = await db.from("membres").select("user_id").eq("telephone", telephone).maybeSingle();
    if (!membre) return invalide;
    const { data: ligne } = await db.from("membres_reinit").select("*").eq("user_id", membre.user_id).maybeSingle();
    if (!ligne || new Date(ligne.expire_le).getTime() < Date.now() || ligne.essais >= 5) return invalide;
    if (ligne.code_hash !== (await sha256(`${membre.user_id}:${code}`))) {
      await db.from("membres_reinit").update({ essais: ligne.essais + 1 }).eq("user_id", membre.user_id);
      return invalide;
    }
    const { error } = await db.auth.admin.updateUserById(membre.user_id, { password: nouveau });
    if (error) {
      console.error("[reinit] updateUserById :", error.message);
      return refus(MSG_MDP_REFUSE);
    }
    await db.from("membres_reinit").delete().eq("user_id", membre.user_id);
    return { ok: true };
  } catch (e) {
    console.error("[reinitialiserMotDePasse]", e);
    return refus(MSG_INDISPONIBLE);
  }
});
