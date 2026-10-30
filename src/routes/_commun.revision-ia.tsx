import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { RevisionWorkspace } from "@/components/RevisionWorkspace";
export const Route = createFileRoute("/_commun/revision-ia")({
  head: () => ({ meta: [ { title: "Révision & IA — CampusLink" }, { name: "description", content: "Vos cours, résumés PDF, QCM, fiches et sujets d’entraînement sur CampusLink." }, { property: "og:title", content: "Révision & IA — CampusLink" }, { property: "og:description", content: "L’espace de révision des étudiants CampusLink." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" } ] }),
  component: () => <EspacesShell title="Révision & IA"><RevisionWorkspace /></EspacesShell>,
});
