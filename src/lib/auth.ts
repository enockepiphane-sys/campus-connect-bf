import { supabase } from "@/integrations/supabase/client";

export type UserRole = "super_admin" | "admin" | "etudiant" | null;

/**
 * Résout le rôle de l'utilisateur courant. Auto-finalise :
 *  - si email présent dans admins_pre_autorises (non lié) → appelle finaliser_inscription_admin
 *  - si email présent dans etudiants_pre_inscrits (non lié) → appelle finaliser_inscription_etudiant
 * Renvoie le rôle après finalisation.
 */
export async function resolveUserRole(): Promise<UserRole> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  // 1) rôle existant ?
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (roles && roles.length > 0) {
    if (roles.some((r) => r.role === "super_admin")) return "super_admin";
    if (roles.some((r) => r.role === "admin")) return "admin";
    if (roles.some((r) => r.role === "etudiant")) return "etudiant";
  }

  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return null;

  // 2) auto-finalisation admin
  const { data: preAdmin } = await supabase
    .from("admins_pre_autorises")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (preAdmin) {
    await supabase.rpc("finaliser_inscription_admin", {
      _pre_autorisation_id: preAdmin.id,
    });
    return "admin";
  }

  // 3) auto-finalisation étudiant
  const { data: preEtu } = await supabase
    .from("etudiants_pre_inscrits")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
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
