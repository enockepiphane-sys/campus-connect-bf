import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // 0. Lien venant d'un email de notification (?verif=1) : on force une
    // reconnexion explicite avant de laisser entrer, même si une session
    // existe déjà sur cet appareil.
    const search = location.search as Record<string, unknown>;
    if (search?.verif === "1" || search?.verif === 1) {
      await supabase.auth.signOut();
      const { verif, ...reste } = search;
      void verif;
      const query = new URLSearchParams(reste as Record<string, string>).toString();
      const destination = location.pathname + (query ? `?${query}` : "");
      throw redirect({ to: "/etudiant/connexion", search: { redirectTo: destination } });
    }

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
        
