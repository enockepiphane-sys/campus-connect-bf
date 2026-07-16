import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";
import { humanizeAuthError } from "@/lib/auth-timeout";

export const Route = createFileRoute("/super-admin-acces")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const role = await resolveUserRole();
      if (role === "super_admin") navigate({ to: dashboardPathForRole("super_admin") });
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !signInData.user) {
        setError(humanizeAuthError(signInError ?? new Error("Connexion échouée")));
        setStatus("idle");
        return;
      }

      // Vérification directe côté client : user_id doit exister dans super_admins
      const { data: sa, error: saError } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (saError || !sa) {
        await supabase.auth.signOut();
        setError("Accès non autorisé.");
        setStatus("idle");
        return;
      }

      navigate({ to: dashboardPathForRole("super_admin") });
    } catch (err) {
      setError(humanizeAuthError(err));
      setStatus("idle");
    }
  }

  return (
    <PageShell title="Accès Super Administrateur">
      <p className="mb-6 text-sm text-muted-foreground">
        Espace réservé. Utilisez vos identifiants super administrateur.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-bf-primary w-full disabled:opacity-60"
        >
          {status === "loading" ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/" className="text-xs text-muted-foreground underline">
          Retour à l'accueil
        </Link>
      </div>
    </PageShell>
  );
}
