import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Vérifie que l'utilisateur connecté est présent dans super_admins,
 * et lui attribue le rôle super_admin si ce n'est pas déjà fait.
 * Endpoint interne : le token bearer de l'utilisateur est requis.
 */
export const Route = createFileRoute("/api/super-admin/ensure-role")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return Response.json({ ok: false, error: "no auth" }, { status: 401 });

        const supabaseUser = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false }, global: { headers: { Authorization: authHeader } } },
        );

        const { data: userData, error: ue } = await supabaseUser.auth.getUser();
        if (ue || !userData.user) return Response.json({ ok: false }, { status: 401 });
        const user = userData.user;
        const email = (user.email ?? "").trim().toLowerCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: sa } = await supabaseAdmin
          .from("super_admins")
          .select("id, user_id")
          .ilike("email", email)
          .maybeSingle();

        if (!sa) return Response.json({ ok: false, reason: "not_super_admin" });

        if (!sa.user_id) {
          await supabaseAdmin.from("super_admins").update({ user_id: user.id }).eq("id", sa.id);
        }
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "super_admin")
          .maybeSingle();
        if (!existing) {
          await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: user.id, role: "super_admin" });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
