import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/admin/connexion")({
  component: () => (
    <PageShell title="Connexion administrateur">
      <p>Cette section sera disponible à l'étape 3.</p>
    </PageShell>
  ),
});
