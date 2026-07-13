import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — CampusLink" },
      {
        name: "description",
        content:
          "Découvrez les fonctionnalités de CampusLink pour les universités du Burkina Faso.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="Fonctionnalités">
      <ul className="space-y-4 text-white/85">
        <li>
          <strong className="text-white">Espaces isolés par niveau et filière</strong> —
          chaque groupe d'étudiants dispose de son propre espace (annonces, emploi
          du temps, événements, notes).
        </li>
        <li>
          <strong className="text-white">Import CSV des listes étudiantes</strong> —
          les administrateurs importent la liste officielle des étudiants
          pré-inscrits d'un niveau/filière.
        </li>
        <li>
          <strong className="text-white">Notes par matière</strong> — import des
          notes par module ; chaque étudiant ne voit que ses propres notes.
        </li>
        <li>
          <strong className="text-white">Annonces, événements, emploi du temps</strong> —
          diffusés à un niveau/filière donné.
        </li>
        <li>
          <strong className="text-white">Sécurité et confidentialité</strong> —
          politiques strictes : aucune donnée sensible n'est publique.
        </li>
      </ul>
    </PageShell>
  );
}
