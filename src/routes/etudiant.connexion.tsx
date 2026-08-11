import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";
import { withTimeout, humanizeAuthError } from "@/lib/auth-timeout";

export const Route = createFileRoute("/etudiant/connexion")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Détecte le retour d'un lien de confirmation d'inscription (hash Supabase).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && /type=(signup|email_change)/.test(hash)) {
      supabase.auth.signOut().finally(() => {
        setInfo("Votre compte a été confirmé, connectez-vous pour continuer.");
        history.replaceState(null, "", window.location.pathname);
      });
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    try {
      const { error: le } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        10000, "la connexion",
      );
      if (le) { setError(humanizeAuthError(le)); setBusy(false); return; }
      const role = await withTimeout(resolveUserRole(), 10000, "la vérification du rôle");
      if (!role) {
        await supabase.auth.signOut();
        setError("Aucun compte étudiant trouvé. Inscrivez-vous d'abord.");
        setBusy(false); return;
      }
      if (role !== "etudiant") {
        setError(`Ce compte est ${role}, pas étudiant.`);
        setBusy(false); return;
      }
      navigate({ to: dashboardPathForRole(role) });
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  return (
    <PageShell title="Connexion étudiant">
      {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>}
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
          <div className="mt-1 text-right">
            <Link to="/etudiant/mot-de-passe-oublie" className="text-xs text-primary underline">Mot de passe oublié ?</Link>
          </div>
        </div>
        <button disabled={busy} className="btn-bf-primary w-full">{busy ? "..." : "Se connecter"}</button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/etudiant/inscription" className="text-sm text-primary underline">Pas encore de compte ? S'inscrire</Link>
      </div>
    </PageShell>
  );
}
