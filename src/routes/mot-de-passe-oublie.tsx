import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, ArrowLeft, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { getRedirectURL } from "@/lib/auth";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — CampusLink" }] }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${getRedirectURL()}/reinitialiser-mot-de-passe` },
    );

    if (resetError) {
      setStatus("error");
      const msg = resetError.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many")) {
        setError("Trop de demandes. Veuillez patienter quelques minutes avant de réessayer.");
      } else {
        setError("Une erreur est survenue. Vérifiez votre adresse email et réessayez.");
      }
      return;
    }

    setStatus("ok");
  }

  return (
    <PageShell title="Mot de passe oublié">
      <div className="card-glass mx-auto max-w-md rounded-2xl p-8">
        {status === "ok" ? (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-accent/10 text-accent">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">Email envoyé</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Un lien de réinitialisation a été envoyé à votre adresse email.
              Vérifiez votre boîte de réception (et vos spams).
            </p>
            <Link to="/" className="btn-bf-outline">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Saisissez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Mail className="h-4 w-4" /> Adresse email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
                />
              </div>
              <button type="submit" disabled={status === "sending"} className="btn-bf-primary w-full disabled:opacity-60">
                <Send className="h-4 w-4" />
                {status === "sending" ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-1 inline h-3 w-3" />Retour à l'accueil
              </Link>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
