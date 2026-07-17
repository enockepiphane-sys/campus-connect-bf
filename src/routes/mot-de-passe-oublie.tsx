import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { humanizeAuthError } from "@/lib/auth-timeout";
import { getSiteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${getSiteUrl()}/reinitialiser-mot-de-passe` },
    );

    if (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
      return;
    }

    setSuccess(true);
    setBusy(false);
  }

  if (success) {
    return (
      <PageShell title="Email envoyé">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✉️
          </div>
          <p className="text-foreground/80">
            Un lien de réinitialisation a été envoyé à{" "}
            <span className="font-semibold text-primary">{email}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Vérifiez votre boîte mail (et les spams). Le lien est valable 1 heure.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
            Retour à l'accueil
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Mot de passe oublié">
      <p className="mb-6 text-sm text-muted-foreground">
        Saisissez votre adresse email. Vous recevrez un lien pour créer un nouveau mot de passe.
      </p>
      {error && (
        <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Adresse email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-2"
            placeholder="votre@email.com"
          />
        </div>
        <button disabled={busy} className="btn-bf-primary w-full">
          {busy ? "Envoi en cours…" : "Envoyer le lien"}
        </button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm">
        <div>
          <Link to="/admin/connexion" className="text-primary underline">
            Connexion administrateur
          </Link>
        </div>
        <div>
          <Link to="/etudiant/connexion" className="text-primary underline">
            Connexion étudiant
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
