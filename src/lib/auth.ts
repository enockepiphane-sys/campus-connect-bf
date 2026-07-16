import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "etudiant";

export interface AuthResult {
  ok: boolean;
  role: AppRole | null;
  error: string | null;
}

/**
 * Shared authentication logic used by BOTH the normal login form
 * and the discreet super admin login form.
 *
 * 1. Calls supabase.auth.signInWithPassword (same method everywhere)
 * 2. Checks user_roles table for the user's role
 * 3. If expectedRole is provided, verifies the user has that role
 */
export async function authenticateUser(
  email: string,
  password: string,
  expectedRole?: AppRole,
): Promise<AuthResult> {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (authError || !authData.user) {
    return { ok: false, role: null, error: "Accès non autorisé" };
  }

  const userId = authData.user.id;

  // Check user_roles for this user
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError || !roleData) {
    // Fallback: check super_admins table
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (superAdmin) {
      if (expectedRole && expectedRole !== "super_admin") {
        await supabase.auth.signOut();
        return { ok: false, role: null, error: "Accès non autorisé" };
      }
      return { ok: true, role: "super_admin", error: null };
    }

    // Fallback: check admins_pre_autorises
    const { data: admin } = await supabase
      .from("admins_pre_autorises")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (admin) {
      if (expectedRole && expectedRole !== "admin") {
        await supabase.auth.signOut();
        return { ok: false, role: null, error: "Accès non autorisé" };
      }
      return { ok: true, role: "admin", error: null };
    }

    await supabase.auth.signOut();
    return { ok: false, role: null, error: "Accès non autorisé" };
  }

  const role = roleData.role as AppRole;

  if (expectedRole && role !== expectedRole) {
    await supabase.auth.signOut();
    return { ok: false, role: null, error: "Accès non autorisé" };
  }

  return { ok: true, role, error: null };
}
