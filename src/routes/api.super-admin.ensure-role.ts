import { createFileRoute } from "@tanstack/react-router";

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
        const body = await request.json().catch(() => null) as { access_token?: unknown } | null;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (authHeader && !authHeader.startsWith("Bearer ")) {
          return Response.json({ ok: false, error: "invalid_auth_header" }, { status: 401 });
        }

        const bodyToken = typeof body?.access_token === "string" ? body.access_token.trim() : "";
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : bodyToken;
        if (!token || token.split(".").length !== 3) {
          return Response.json({ ok: false, error: "invalid_token_format" }, { status: 401 });
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) {
          return Response.json({ ok: false, error: "invalid_session" }, { status: 401 });
        }

        const user = userData.user;
        const email = (user.email ?? "").trim().toLowerCase();

        const { data: saByUserId, error: saByUserIdError } = await supabaseAdmin
          .from("super_admins")
          .select("id, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (saByUserIdError) {
          return Response.json({ ok: false, error: "super_admin_lookup_failed" }, { status: 500 });
        }

        let superAdmin = saByUserId;

        if (!superAdmin && email) {
          const { data: saByEmail, error: saByEmailError } = await supabaseAdmin
            .from("super_admins")
            .select("id, user_id")
            .ilike("email", email)
            .maybeSingle();

          if (saByEmailError) {
            return Response.json({ ok: false, error: "super_admin_lookup_failed" }, { status: 500 });
          }

          if (saByEmail?.user_id && saByEmail.user_id !== user.id) {
            return Response.json({ ok: false, reason: "user_id_mismatch" }, { status: 403 });
          }

          if (saByEmail && !saByEmail.user_id) {
            const { error: linkError } = await supabaseAdmin
              .from("super_admins")
              .update({ user_id: user.id })
              .eq("id", saByEmail.id);
            if (linkError) {
              return Response.json({ ok: false, error: "super_admin_link_failed" }, { status: 500 });
            }
            superAdmin = { ...saByEmail, user_id: user.id };
          } else {
            superAdmin = saByEmail;
          }
        }

        if (!superAdmin || superAdmin.user_id !== user.id) {
          return Response.json({ ok: false, reason: "not_super_admin" }, { status: 403 });
        }

        const { data: existing, error: roleLookupError } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "super_admin")
          .maybeSingle();

        if (roleLookupError) {
          return Response.json({ ok: false, error: "role_lookup_failed" }, { status: 500 });
        }

        if (!existing) {
          const { error: insertRoleError } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: user.id, role: "super_admin" });
          if (insertRoleError) {
            return Response.json({ ok: false, error: "role_grant_failed" }, { status: 500 });
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
