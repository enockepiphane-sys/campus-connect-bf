import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const Route = createFileRoute("/super-admin-acces_/mot-de-passe-oublie")({
  component: Page,
});

function Page() {
  return (
    <PageShell title="Mot de passe oublié (super administrateur)">
      <p className="mb-4 text-sm text-muted-foreground">
        Saisissez l'adresse email associée à votre compte super administrateur.
        Vous recevrez un lien pour définir un nouveau mot de passe.
      </p>
      <ForgotPasswordForm backTo="/super-admin-acces" />
    </PageShell>
  );
}
