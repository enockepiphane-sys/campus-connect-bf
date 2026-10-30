import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { OpportunitesList } from "@/components/OpportunitesList";
export const Route = createFileRoute("/_commun/opportunites")({
  head: () => ({ meta: [ { title: "Opportunités — CampusLink" }, { name: "description", content: "Découvrez stages, emplois, bourses, concours, formations et appels à candidatures." }, { property: "og:title", content: "Opportunités — CampusLink" }, { property: "og:description", content: "Les opportunités professionnelles et académiques pour tous les inscrits CampusLink." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" } ] }),
  component: () => <EspacesShell title="Opportunités"><OpportunitesList /></EspacesShell>,
});
