import { supabase } from "@/integrations/supabase/client";

export type UserRole = "super_admin" | "admin" | "etudiant" | null;

export async function resolveUserRole(): Promise<UserRole> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (roles && roles.length > 0) {
    if (roles.some((r) => r.role === "super_admin")) return "super_admin";
    if (roles.some((r) => r.role === "admin")) return "admin";
    if (roles.some((r) => r.role === "etudiant")) return "etudiant";
  }

  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (superAdmin) return "super_admin";

  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return null;

  const { data: preAdminRows } = await supabase.rpc(
    "trouver_pre_autorisation_admin_par_email",
    { _email: email },
  );
  const preAdmin = preAdminRows && preAdminRows.length > 0 ? preAdminRows[0] : null;
  if (preAdmin) {
    await supabase.rpc("finaliser_inscription_admin", {
      _pre_autorisation_id: preAdmin.id,
    });
    return "admin";
  }

  const { data: preEtuRows } = await supabase.rpc(
    "trouver_pre_inscription_etudiant_par_email",
    { _email: email },
  );
  const preEtu = preEtuRows && preEtuRows.length > 0 ? preEtuRows[0] : null;
  if (preEtu) {
    await supabase.rpc("finaliser_inscription_etudiant", {
      _pre_inscription_id: preEtu.id,
    });
    return "etudiant";
  }

  return null;
}

export function dashboardPathForRole(role: UserRole): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/admin";
  if (role === "etudiant") return "/etudiant";
  return "/";
}

export async function signOutAndGoHome() {
  await supabase.auth.signOut();
  window.location.href = "/";
     }
