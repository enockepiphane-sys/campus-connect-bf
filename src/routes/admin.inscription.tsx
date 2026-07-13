import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/admin/inscription")({
  component: () => (
    <PageShell title="Inscription administrateur">
      <p>Cette section sera disponible à l'étape 3.</p>
    </PageShell>
  ),
});
