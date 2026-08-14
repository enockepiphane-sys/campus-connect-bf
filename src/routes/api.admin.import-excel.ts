import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { warnIfSupabaseProjectMismatch } from "@/integrations/supabase/project-binding";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const ligneEtudiantSchema = z.object({
  nom_complet: z.string().min(1).max(200),
  email: z.string().email().max(200),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  matricule: z.string().max(100).optional(),
  telephone: z.string().max(30).optional(),
});

const requestBody = z.object({
  niveauId: z.string().uuid("Niveau invalide."),
  lignes: z.array(ligneEtudiantSchema).min(1).max(5000, "Trop de lignes (max 5000)."),
});

/**
 * Endpoint serveur pour importer un fichier Excel d'étudiants pré-inscrits.
 * Remplace l'import CSV. Le parsing/normalisation (nom+prénom, format de date)
 * se fait côté client (src/lib/excel.ts) avant l'envoi ; ce endpoint valide et insère.
 * L'administrateur authentifié ne peut importer que pour son propre établissement.
 * RLS s'applique via le client authentifié ; aucune clé service_role n'est requise.
 */
export const Route = createFileRoute("/api/admin/import-excel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY =
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_ANON_KEY;
        const EXPECTED_SUPABASE_PROJECT_ID =
          process.env.EXPECTED_SUPABASE_PROJECT_ID || process.env.VITE_EXPECTED_SUPABASE_PROJECT_ID;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return Response.json({ error: "missing_supabase_env" }, { status: 500 });
        }

        warnIfSupabaseProjectMismatch({
          source: "api.admin.import-excel",
          supabaseUrl: SUPABASE_URL,
          expectedProjectRef: EXPECTED_SUPABASE_PROJECT_ID,
        });

        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token || token.split(".").length !== 3) {
          return Response.json({ error: "invalid_token" }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const parsed = requestBody.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "invalid_body", details: parsed.error.format() },
            { status: 400 },
          );
        }
        const { niveauId, lignes } = parsed.data;

        // Client authentifié avec le token de l'admin : RLS s'applique normalement.
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: {
            fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
            headers: { Authorization: `Bearer ${token}` },
          },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return Response.json({ error: "invalid_session" }, { status: 401 });
        }
        const userId = userData.user.id;

        const { data: roleRow, error: roleError } = await supabase
          .from("user_roles")
          .select("etablissement_id")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError || !roleRow?.etablissement_id) {
          return Response.json({ error: "admin_etablissement_not_found" }, { status: 403 });
        }
        const etablissementId = roleRow.etablissement_id;

        const { data: niveau, error: niveauError } = await supabase
          .from("niveaux")
          .select("id, nom, filiere_id, filieres!inner(etablissement_id)")
          .eq("id", niveauId)
          .eq("filieres.etablissement_id", etablissementId)
          .maybeSingle();

        if (niveauError || !niveau) {
          return Response.json({ error: "niveau_not_authorized" }, { status: 403 });
        }
        const filiereId = niveau.filiere_id;

        // Ne conserve matricule/telephone que si la config établissement les autorise,
        // pour éviter qu'un client manipulé envoie des champs non désirés.
        const { data: config } = await supabase
          .from("etablissement_champs_optionnels")
          .select("utilise_matricule, utilise_telephone")
          .eq("etablissement_id", etablissementId)
          .maybeSingle();

        const autoriseMatricule = config?.utilise_matricule ?? false;
        const autoriseTelephone = config?.utilise_telephone ?? false;

        const payload = lignes.map((r) => ({
          etablissement_id: etablissementId,
          filiere_id: filiereId,
          niveau_id: niveauId,
          nom_complet: r.nom_complet.trim(),
          email: r.email.trim().toLowerCase(),
          date_naissance: r.date_naissance,
          matricule: autoriseMatricule ? r.matricule?.trim() || null : null,
          telephone: autoriseTelephone ? r.telephone?.trim() || null : null,
        }));

        const { error: insertError } = await supabase
          .from("etudiants_pre_inscrits")
          .insert(payload);

        if (insertError) {
          return Response.json(
            { error: "insert_failed", message: insertError.message },
            { status: 500 },
          );
        }

        return Response.json({ imported: payload.length });
      },
    },
  },
});
