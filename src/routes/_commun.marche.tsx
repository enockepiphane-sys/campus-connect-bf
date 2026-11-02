import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { MarcheList } from "@/components/MarcheList";

export const Route = createFileRoute("/_commun/marche")({
  head: () => ({
    meta: [
      { title: "Marché étudiant — CampusLink" },
      { name: "description", content: "Achète, vends ou échange livres, cours, services universitaires et colocations entre étudiants du Burkina Faso." },
      { property: "og:title", content: "Marché étudiant — CampusLink" },
      { property: "og:description", content: "Livres, documents, services et colocations : les petites annonces des étudiants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <EspacesShell title="Marché étudiant">
      <MarcheList />
    </EspacesShell>
  ),
});
