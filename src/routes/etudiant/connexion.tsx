import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { authenticateUser } from "@/lib/auth";

export const Route = createFileRoute("/etudiant/connexion")({
  head: () => ({ meta: [{ title: "Connexion Étudiant — CampusLink" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const result = await authenticateUser(email, password, "etudiant");

    if (!result.ok) {
      setError(result.error || "Accès non autorisé");
      setBusy(false);
      return;
    }

    navigate({ to: "/etudiant/dashboard" });
  }

  return (
    <PageShell title="Connexion Étudiant">
      <div className="card-glass mx-auto max-w-md rounded-2xl p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80"><Mail className="h-4 w-4" /> Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80"><Lock className="h-4 w-4" /> Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
          </div>
          <button type="submit" disabled={busy} className="btn-bf-primary w-full disabled:opacity-60">
            <LogIn className="h-4 w-4" /> {busy ? "..." : "Se connecter"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
