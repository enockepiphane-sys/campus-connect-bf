import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { EvenementsPage } from "@/components/EvenementsPage";

export const Route = createFileRoute("/evenements")({
  head: () => ({
    meta: [
      { title: "Événements sociaux — CampusLink" },
      { name: "description", content: "Concerts, conférences, rencontres et activités étudiantes : l'agenda des événements sociaux de CampusLink." },
      { property: "og:title", content: "Événements sociaux — CampusLink" },
      { property: "og:description", content: "L'agenda des événements sociaux et de la vie étudiante au Burkina Faso." },
    ],
  }),
  component: () => (
    <EspacesShell title="Événements sociaux">
      <EvenementsPage />
    </EspacesShell>
  ),
});
