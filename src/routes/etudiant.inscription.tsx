import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/etudiant/inscription")({
  component: () => (
    <PageShell title="Inscription étudiant">
      <p>Cette section sera disponible à l'étape 4.</p>
    </PageShell>
  ),
});
