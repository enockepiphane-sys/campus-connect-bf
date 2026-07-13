import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/cours-en-ligne")({
  head: () => ({
    meta: [
      { title: "Cours en ligne — CampusLink" },
      {
        name: "description",
        content:
          "Cours en ligne pour les étudiants des universités du Burkina Faso.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="Cours en ligne">
      <p>
        Bientôt : accès à une bibliothèque de cours et de supports pédagogiques
        proposés par les universités partenaires du Burkina Faso.
      </p>
      <p className="mt-4">
        Cette section sera enrichie progressivement à mesure que les
        établissements partagent leurs contenus.
      </p>
    </PageShell>
  );
}
