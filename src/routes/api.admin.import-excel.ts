import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { warnIfSupabaseProjectMismatch } from "@/integrations/supabase/project-binding";

const importRow = z.object({
  nom_complet: z.string().trim().min(1),
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  date_naissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Date de naissance invalide."),
  filiere: z.string().trim().min(1),
  niveau: z.string().trim().min(1),
});

const requestBody = z.object({
  niveauId: z.string().uuid().optional(),
  rows: z.array(importRow).min(1).max(10_000),
});

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
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

function key(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Vérifie à nouveau les lignes côté serveur avant l'insertion.
 * L'insertion reste une pré-inscription classique, comme l'ajout manuel.
 */
export const Route = createFileRoute("/api/admin/import-excel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey =
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_ANON_KEY;
        const expectedProjectId =
          process.env.EXPECTED_SUPABASE_PROJECT_ID || process.env.VITE_EXPECTED_SUPABASE_PROJECT_ID;
        if (!supabaseUrl || !supabaseKey) {
          return Response.json({ error: "missing_supabase_env" }, { status: 500 });
        }
        warnIfSupabaseProjectMismatch({
          source: "api.admin.import-excel",
          supabaseUrl,
          expectedProjectRef: expectedProjectId,
        });

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token || token.split(".").length !== 3) {
          return Response.json({ error: "invalid_token" }, { status: 401 });
        }

        const parsed = requestBody.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json(
            { error: "invalid_body", details: parsed.error.format() },
            { status: 400 },
          );
        }

        const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
          global: {
            fetch: createSupabaseFetch(supabaseKey),
            headers: { Authorization: `Bearer ${token}` },
          },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
          return Response.json({ error: "invalid_session" }, { status: 401 });
        }

        const { data: roleRow, error: roleError } = await supabase
          .from("user_roles")
          .select("etablissement_id")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (roleError || !roleRow?.etablissement_id) {
          return Response.json({ error: "admin_etablissement_not_found" }, { status: 403 });
        }
        const etablissementId = roleRow.etablissement_id;

        const { data: filieres, error: filieresError } = await supabase
          .from("filieres")
          .select("id,nom")
          .eq("etablissement_id", etablissementId)
          .is("deleted_at", null);
        if (filieresError) {
          return Response.json({ error: "filieres_unavailable" }, { status: 500 });
        }
        const filiereMap = new Map((filieres ?? []).map((f) => [key(f.nom), f]));
        const filiereIds = (filieres ?? []).map((f) => f.id);
        const { data: niveaux, error: niveauxError } = filiereIds.length
          ? await supabase
              .from("niveaux")
              .select("id,nom,filiere_id")
              .in("filiere_id", filiereIds)
              .is("deleted_at", null)
          : { data: [], error: null };
        if (niveauxError) {
          return Response.json({ error: "niveaux_unavailable" }, { status: 500 });
        }
        const niveauMap = new Map((niveaux ?? []).map((n) => [`${n.filiere_id}:${key(n.nom)}`, n]));
        const { data: existing, error: existingError } = await supabase
          .from("etudiants_pre_inscrits")
          .select("email")
          .eq("etablissement_id", etablissementId)
          .is("deleted_at", null);
        if (existingError) {
          return Response.json({ error: "existing_students_unavailable" }, { status: 500 });
        }
        const existingEmails = new Set((existing ?? []).map((row) => row.email.toLowerCase()));
        const seen = new Set<string>();
        const errors: Array<{ index: number; messages: string[] }> = [];
        const payload: Database["public"]["Tables"]["etudiants_pre_inscrits"]["Insert"][] = [];

        parsed.data.rows.forEach((row, index) => {
          const rowErrors: string[] = [];
          const filiere = filiereMap.get(key(row.filiere));
          const niveau = filiere ? niveauMap.get(`${filiere.id}:${key(row.niveau)}`) : undefined;
          if (!filiere)
            rowErrors.push(`La filière « ${row.filiere} » n'existe pas dans cet établissement.`);
          else if (!niveau)
            rowErrors.push(`Le niveau « ${row.niveau} » ne correspond pas à cette filière.`);
          if (existingEmails.has(row.email)) rowErrors.push("Cet email existe déjà dans la base.");
          if (seen.has(row.email))
            rowErrors.push("Cet email est présent plusieurs fois dans le fichier.");
          seen.add(row.email);
          if (rowErrors.length || !filiere || !niveau) {
            errors.push({ index: index + 1, messages: rowErrors });
            return;
          }
          payload.push({
            etablissement_id: etablissementId,
            filiere_id: filiere.id,
            niveau_id: niveau.id,
            nom_complet: row.nom_complet.trim(),
            email: row.email.trim().toLowerCase(),
            date_naissance: row.date_naissance,
          });
        });

        if (errors.length) {
          return Response.json({ error: "validation_failed", errors }, { status: 422 });
        }
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
