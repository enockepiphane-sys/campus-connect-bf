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
    const user = data.user;

    // 2. Vérification en cascade selon le rôle : si l'étudiant, son
    // établissement, sa filière ou son niveau a été mis en corbeille
    // (deleted_at renseigné), on déconnecte immédiatement.

    // --- Côté étudiant ---
    const { data: etudiant } = await supabase
      .from("etudiants_pre_inscrits")
      .select("deleted_at, niveau_id, filiere_id, etablissement_id")
      .eq("email", user.email)
      .maybeSingle();

    if (etudiant) {
      if (etudiant.deleted_at) {
        await supabase.auth.signOut();
        throw redirect({ to: "/" });
      }
      const [{ data: niveau }, { data: filiere }, { data: etab }] = await Promise.all([
        etudiant.niveau_id
          ? supabase.from("niveaux").select("deleted_at").eq("id", etudiant.niveau_id).maybeSingle()
          : Promise.resolve({ data: null }),
        etudiant.filiere_id
          ? supabase.from("filieres").select("deleted_at").eq("id", etudiant.filiere_id).maybeSingle()
          : Promise.resolve({ data: null }),
        etudiant.etablissement_id
          ? supabase.from("etablissements").select("deleted_at").eq("id", etudiant.etablissement_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (niveau?.deleted_at || filiere?.deleted_at || etab?.deleted_at) {
        await supabase.auth.signOut();
        throw redirect({ to: "/" });
      }
    }

    // --- Côté admin (établissement + pré-autorisation elle-même) ---
    const { data: roleAdmin } = await supabase
      .from("user_roles")
      .select("etablissement_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleAdmin?.etablissement_id) {
      const { data: etabAdmin } = await supabase
        .from("etablissements")
        .select("deleted_at")
        .eq("id", roleAdmin.etablissement_id)
        .maybeSingle();
      if (etabAdmin?.deleted_at) {
        await supabase.auth.signOut();
        throw redirect({ to: "/" });
      }

      const { data: preAdmin } = await supabase
        .from("admins_pre_autorises")
        .select("deleted_at")
        .eq("email", user.email)
        .maybeSingle();
      if (preAdmin?.deleted_at) {
        await supabase.auth.signOut();
        throw redirect({ to: "/" });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
        
