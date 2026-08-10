import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordFlow } from "@/components/ResetPasswordFlow";

export const Route = createFileRoute("/reset-password")({
  component: Page,
  ssr: false,
});

function Page() {
  return <ResetPasswordFlow />;
}
