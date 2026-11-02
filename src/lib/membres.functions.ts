import { createServerFn } from "@tanstack/react-start";
import { emailMembre, normaliserTelephone, validerInscription } from "./membres";

// Crée le compte membre côté serveur, déjà confirmé : pas d'email à recevoir,
// l'utilisateur est connecté immédiatement et reste connecté sur son téléphone.
export const inscrireMembre = createServerFn({ method: "POST" })
  .validator((data: { nom: string; telephone: string; motDePasse: string }) => {
    const probleme = validerInscription(String(data?.nom ?? ""), String(data?.telephone ?? ""), String(data?.motDePasse ?? ""));
    if (probleme) throw new Error(probleme);
    return { nom: data.nom.trim(), telephone: normaliserTelephone(data.telephone), motDePasse: data.motDePasse };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin as any;

    const { data: existant } = await admin.from("membres").select("user_id").eq("telephone", data.telephone).maybeSingle();
    if (existant) return { ok: false as const, message: "Ce numéro est déjà inscrit. Connectez-vous." };

    const { data: cree, error } = await admin.auth.admin.createUser({
      email: emailMembre(data.telephone),
      password: data.motDePasse,
      email_confirm: true,
      user_metadata: { nom_profil: data.nom, telephone: data.telephone, type_compte: "membre" },
    });
    if (error || !cree?.user) {
      const deja = /already|registered|exists/i.test(error?.message ?? "");
      return { ok: false as const, message: deja ? "Ce numéro est déjà inscrit. Connectez-vous." : "Inscription impossible pour le moment. Réessayez." };
    }
    const { error: errProfil } = await admin.from("membres").insert({ user_id: cree.user.id, nom_profil: data.nom, telephone: data.telephone });
    if (errProfil) {
      await admin.auth.admin.deleteUser(cree.user.id);
      return { ok: false as const, message: "Inscription impossible pour le moment. Réessayez." };
    }
    return { ok: true as const };
  });
