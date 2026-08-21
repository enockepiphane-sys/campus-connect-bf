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

  // Priorité à la finalisation par identifiant exact (pre_inscription_id /
  // pre_autorisation_id transmis lors du signUp) : c'est la méthode sûre
  // en cas d'email dupliqué entre plusieurs pré-inscriptions. On ne se
  // rabat sur la recherche par email seul (moins sûre, gardée pour les
  // comptes créés avant ce correctif) que si ces fonctions ne trouvent
  // rien.
  const { data: estAdminParId } = await supabase.rpc("finaliser_inscription_admin_par_id_securise");
  if (estAdminParId) return "admin";

  const { data: estEtudiantParId } = await supabase.rpc("finaliser_inscription_etudiant_par_id_securise");
  if (estEtudiantParId) return "etudiant";

  const { data: estAdmin } = await supabase.rpc("finaliser_inscription_admin_par_email");
  if (estAdmin) return "admin";

  const { data: estEtudiant } = await supabase.rpc("finaliser_inscription_etudiant_par_email");
  if (estEtudiant) return "etudiant";

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
