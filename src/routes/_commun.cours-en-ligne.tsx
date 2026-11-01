import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { CoursEnLigneList } from "@/components/CoursEnLigneList";

export const Route = createFileRoute("/_commun/cours-en-ligne")({
  head: () => ({
    meta: [
      { title: "Cours en ligne — CampusLink" },
      { name: "description", content: "Cours en vidéo, PDF, photos et manuscrits classés par filière, niveau et module pour les étudiants du Burkina Faso." },
      { property: "og:title", content: "Cours en ligne — CampusLink" },
      { property: "og:description", content: "Trouve tes cours par filière, niveau et module : vidéos, PDF et manuscrits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <EspacesShell title="Cours en ligne">
      <CoursEnLigneList />
    </EspacesShell>
  ),
});
