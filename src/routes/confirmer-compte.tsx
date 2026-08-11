import { createFileRoute } from "@tanstack/react-router";
import { ConfirmerCompteFlow } from "@/components/ConfirmerCompteFlow";

export const Route = createFileRoute("/confirmer-compte")({
  component: Page,
  ssr: false,
});

function Page() {
  return <ConfirmerCompteFlow />;
}
