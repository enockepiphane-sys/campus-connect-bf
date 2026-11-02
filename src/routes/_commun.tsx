import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Fonctionnalités PRIMAIRES (bibliothèque, marché, opportunités, révision, guide, cours, événements) :
// il suffit d'un compte CampusLink (inscription primaire nom + téléphone + mot de passe).
// Tout compte existant (étudiant, admin) y a aussi accès. La session reste enregistrée sur
// l'appareil : après la première inscription, la page s'ouvre directement.
// Les espaces universités / étudiants pré-inscrits (_authenticated) ne sont PAS concernés.
export const Route = createFileRoute("/_commun")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/inscription", search: { retour: location.pathname } });
  },
  component: () => <Outlet />,
});
