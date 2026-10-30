import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { safeSharedDestination } from "@/lib/opportunites-model";
// Ne modifie pas le contrôle institutionnel du layout _authenticated.
export const Route = createFileRoute("/_commun")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/connexion-espaces", search: { retour: safeSharedDestination(location.pathname) } });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
