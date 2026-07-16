import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { parseCSV } from "@/lib/csv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const requestBody = z.object({
  csvText: z.string().max(2_000_000, "Fichier CSV trop volumineux (max 2 Mo)."),
  niveauId: z.string().uuid("Niveau invalide."),
});

/**
 * Endpoint serveur pour importer un CSV d'étudiants pré-inscrits.
 * L'administrateur authentifié ne peut importer que pour son propre établissement.
 * RLS s'applique via le client authentifié ; aucune clé service_role n'est requise.
 */
export const Route = createFileRoute("/api/admin/import-csv")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return Response.json({ error: "missing_supabase_env" }, { status: 500 });
        }

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
          return Response.json({ error: "invalid_body", details: parsed.error.format() }, { status: 400 });
        }
        const { csvText, niveauId } = parsed.data;

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
          return Response.json({ error: "no_valid_rows" }, { status: 400 });
        }

        const { error: insertError } = await supabase
          .from("etudiants_pre_inscrits")
          .insert(payload);

        if (insertError) {
          return Response.json({ error: "insert_failed", message: insertError.message }, { status: 500 });
        }

        return Response.json({ imported: payload.length });
      },
    },
  },
});
