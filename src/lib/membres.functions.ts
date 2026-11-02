import { createServerFn } from "@tanstack/react-start";
import { emailMembre, normaliserTelephone, validerInscription } from "./membres";

type Entree = { nom: string; telephone: string; motDePasse: string };

// Résultat renvoyé au navigateur :
//  - ok: true                       → compte créé (déjà confirmé, aucun email à recevoir)
//  - ok: false, secours: false      → refus normal (numéro déjà inscrit, données invalides…)
//  - ok: false, secours: true       → problème technique côté serveur (clé manquante, etc.) :
//                                      le navigateur essaie alors l'inscription directe (voir membres.ts).
type Resultat = { ok: true } | { ok: false; message: string; secours: boolean };

// Crée le compte membre côté serveur, déjà confirmé : pas d'email à recevoir.
// NB : pas de .validator()/.inputValidator() ici — son nom a changé selon les versions de
// TanStack Start et pouvait faire échouer toute l'inscription. La validation est faite dans le handler.
export const inscrireMembre = createServerFn({ method: "POST" }).handler(async (ctx): Promise<Resultat> => {
  try {
    const brut = ((ctx as unknown as { data?: Partial<Entree> }).data ?? {}) as Partial<Entree>;
    const nom = String(brut.nom ?? "").trim();
    const telephone = normaliserTelephone(String(brut.telephone ?? ""));
    const motDePasse = String(brut.motDePasse ?? "");
    const probleme = validerInscription(nom, telephone, motDePasse);
    if (probleme) return { ok: false, message: probleme, secours: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin as any;

    // Vérification de doublon (si la table « membres » n'existe pas encore, on ignore l'erreur).
    const { data: existant } = await admin.from("membres").select("user_id").eq("telephone", telephone).maybeSingle();
    if (existant) return { ok: false, message: "Ce numéro est déjà inscrit. Connectez-vous.", secours: false };

    const { data: cree, error } = await admin.auth.admin.createUser({
      email: emailMembre(telephone),
      password: motDePasse,
      email_confirm: true,
      user_metadata: { nom_profil: nom, telephone, type_compte: "membre" },
    });
    if (error || !cree?.user) {
      const msg = String(error?.message ?? "");
      console.error("[inscrireMembre] createUser :", msg);
      if (/already|registered|exists/i.test(msg)) {
        return { ok: false, message: "Ce numéro est déjà inscrit. Connectez-vous.", secours: false };
      }
      if (/password/i.test(msg)) {
        return { ok: false, message: "Mot de passe refusé : choisis-en un plus solide (6 caractères minimum, avec lettres et chiffres).", secours: false };
      }
      return { ok: false, message: "Inscription impossible pour le moment.", secours: true };
    }

    // Le profil est secondaire : le compte est déjà créé et utilisable.
    // Une erreur ici (table absente, règle de sécurité…) ne doit JAMAIS bloquer l'inscription.
    const { error: errProfil } = await admin
      .from("membres")
      .upsert({ user_id: cree.user.id, nom_profil: nom, telephone }, { onConflict: "user_id" });
    if (errProfil) console.error("[inscrireMembre] profil non enregistré :", errProfil.message);

    return { ok: true };
  } catch (e) {
    console.error("[inscrireMembre] erreur serveur :", e);
    return { ok: false, message: "Inscription impossible pour le moment.", secours: true };
  }
});
