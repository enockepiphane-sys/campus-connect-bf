import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { OpportunitesAdmin } from "@/components/OpportunitesAdmin";
export const Route = createFileRoute("/_commun/gestion-opportunites")({
  head: () => ({ meta: [ { title: "Gestion des opportunités — CampusLink" }, { name: "description", content: "Administration des stages, emplois, bourses et candidatures CampusLink." }, { property: "og:title", content: "Gestion des opportunités — CampusLink" }, { property: "og:description", content: "Publication et gestion des offres par les administrateurs autorisés." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" } ] }),
  component: () => <EspacesShell title="Gestion des opportunités"><OpportunitesAdmin /></EspacesShell>,
});
