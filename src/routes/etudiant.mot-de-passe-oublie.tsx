import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const Route = createFileRoute("/etudiant/mot-de-passe-oublie")({
  component: Page,
});

function Page() {
  return (
    <PageShell title="Mot de passe oublié (étudiant)">
      <p className="mb-4 text-sm text-muted-foreground">
        Saisissez l'adresse email associée à votre compte étudiant. Vous recevrez
        un lien pour définir un nouveau mot de passe.
      </p>
      <ForgotPasswordForm backTo="/etudiant/connexion" />
    </PageShell>
  );
}
