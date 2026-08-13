import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Vérifier si l'utilisateur est connecté
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/" });
    }

    // 2. Vérifier si le compte a été mis en corbeille (soft-deleted)
    const { data: etudiant } = await supabase
      .from("etudiants_pre_inscrits")
      .select("deleted_at")
      .eq("email", data.user.email)
      .maybeSingle();

    // Si l'étudiant a un deleted_at NON NULL, déconnexion immédiate !
    if (etudiant?.deleted_at) {
      await supabase.auth.signOut();
      throw redirect({ to: "/" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
        
