import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";

export const Route = createFileRoute("/admin/connexion")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    const { error: le } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (le) { setError(le.message); setBusy(false); return; }
    const role = await resolveUserRole();
    if (!role) {
      await supabase.auth.signOut();
      setError("Aucun compte administrateur trouvé pour cet email. Inscrivez-vous d'abord.");
      setBusy(false); return;
    }
    if (role !== "admin") {
      setError(`Ce compte est ${role}, pas administrateur.`);
      setBusy(false); return;
    }
    navigate({ to: dashboardPathForRole(role) });
  }

  return (
    <PageShell title="Connexion administrateur">
      {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm">Mot de passe</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-2" />
        </div>
        <button disabled={busy} className="btn-bf-primary w-full">{busy ? "..." : "Se connecter"}</button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/admin/inscription" className="text-sm text-primary underline">Pas encore de compte ? S'inscrire</Link>
      </div>
    </PageShell>
  );
}
