import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/etudiant/connexion")({
  component: () => (
    <PageShell title="Connexion étudiant">
      <p>Cette section sera disponible à l'étape 4.</p>
    </PageShell>
  ),
});
