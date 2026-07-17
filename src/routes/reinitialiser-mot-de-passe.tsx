import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Lock, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Eye, EyeOff } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  head: () => ({ meta: [{ title: "Réinitialiser le mot de passe — CampusLink" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Supabase appends hash fragments (#access_token=...&type=recovery) when the user
    // clicks the email link. The client library detects this automatically on load.
    // We wait briefly for the session to be established from the recovery token.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session from the URL — the link may be expired or invalid.
        setVerifying(false);
        setError("Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.");
      } else {
        setVerifying(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setStatus("submitting");

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setStatus("error");
      const msg = updateError.message.toLowerCase();
      if (msg.includes("weak") || msg.includes("password")) {
        setError("Le mot de passe est trop faible. Choisissez un mot de passe plus robuste.");
      } else if (msg.includes("session") || msg.includes("token")) {
        setError("Votre session a expiré. Veuillez demander un nouveau lien de réinitialisation.");
      } else {
        setError("Une erreur est survenue lors de la mise à jour. Veuillez réessayer.");
      }
      return;
    }

    setStatus("ok");
    setTimeout(() => {
      supabase.auth.signOut();
      navigate({ to: "/" });
    }, 3000);
  }

  if (verifying) {
    return (
      <PageShell title="Réinitialiser le mot de passe">
        <div className="card-glass mx-auto max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Vérification du lien de réinitialisation...</p>
        </div>
      </PageShell>
    );
  }

  if (status === "ok") {
    return (
      <PageShell title="Réinitialiser le mot de passe">
        <div className="card-glass mx-auto max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-accent/10 text-accent">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Mot de passe mis à jour</h2>
          <p className="text-sm text-muted-foreground">
            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers l'accueil.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Réinitialiser le mot de passe">
      <div className="card-glass mx-auto max-w-md rounded-2xl p-8">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">
              <Lock className="h-4 w-4" /> Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-surface px-3 py-2 pr-10 text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">
              <Lock className="h-4 w-4" /> Confirmer le nouveau mot de passe
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>
          <button type="submit" disabled={status === "submitting"} className="btn-bf-primary w-full disabled:opacity-60">
            {status === "submitting" ? "Mise à jour..." : "Réinitialiser mon mot de passe"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
