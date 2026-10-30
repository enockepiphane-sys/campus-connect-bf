import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EspacesShell } from "@/components/EspacesShell";
import { OpportunitesAdmin } from "@/components/OpportunitesAdmin";
export const Route = createFileRoute("/_commun/gestion-opportunites")({
  // Page réservée aux administrateurs : connexion obligatoire (les autorisations fines restent vérifiées côté base).
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/connexion-espaces", search: { retour: "/gestion-opportunites" } });
  },
  head: () => ({ meta: [ { title: "Gestion des opportunités — CampusLink" }, { name: "description", content: "Administration des stages, emplois, bourses et candidatures CampusLink." }, { property: "og:title", content: "Gestion des opportunités — CampusLink" }, { property: "og:description", content: "Publication et gestion des offres par les administrateurs autorisés." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" } ] }),
  component: () => <EspacesShell title="Gestion des opportunités"><OpportunitesAdmin /></EspacesShell>,
});
