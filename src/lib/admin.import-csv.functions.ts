import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseCSV } from "@/lib/csv";

const importInput = z.object({
  csvText: z.string().max(2_000_000, "Fichier CSV trop volumineux (max 2 Mo)."),
  niveauId: z.string().uuid("Niveau invalide."),
});

/**
 * Import CSV côté serveur d'étudiants pré-inscrits.
 * L'administrateur authentifié ne peut importer que pour son propre établissement.
 * RLS s'applique via le client authentifié ; aucune clé service_role n'est requise.
 */
export const importEtudiantsCSV = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => importInput.parse(data))
  .handler(async ({ data, context }) => {
    const { csvText, niveauId } = data;
    const supabase = context.supabase;
    const userId = context.userId;

    // Récupère l'établissement de l'admin
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("etablissement_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleRow?.etablissement_id) {
      throw new Error("Établissement administrateur introuvable.");
    }
    const etablissementId = roleRow.etablissement_id;

    // Vérifie que le niveau appartient bien à une filière de l'établissement
    const { data: niveau, error: niveauError } = await supabase
      .from("niveaux")
      .select("id, nom, filiere_id, filieres!inner(etablissement_id)")
      .eq("id", niveauId)
      .eq("filieres.etablissement_id", etablissementId)
      .maybeSingle();

    if (niveauError || !niveau) {
      throw new Error("Niveau invalide ou non autorisé pour cet établissement.");
    }

    const filiereId = niveau.filiere_id;

    const { rows } = parseCSV(csvText);
    const payload = rows
      .filter((r) => r.nom_complet && r.email && r.date_naissance)
      .map((r) => ({
        etablissement_id: etablissementId,
        filiere_id: filiereId,
        niveau_id: niveauId,
        nom_complet: r.nom_complet.trim(),
        email: r.email.trim().toLowerCase(),
        date_naissance: r.date_naissance.trim(),
      }));

    if (!payload.length) {
      throw new Error("Aucune ligne valide (colonnes attendues : nom_complet, email, date_naissance).");
    }

    const { error: insertError } = await supabase
      .from("etudiants_pre_inscrits")
      .insert(payload);

    if (insertError) {
      throw new Error(`Échec de l'import : ${insertError.message}`);
    }

    return { imported: payload.length };
  });
