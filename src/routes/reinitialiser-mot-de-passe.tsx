import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { humanizeAuthError, withTimeout } from "@/lib/auth-timeout";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  component: Page,
  ssr: false,
});

function Page() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase place le token en hash (#access_token=…&type=recovery) et
    // établit automatiquement une session "recovery" via detectSessionInUrl.
    // On attend l'événement PASSWORD_RECOVERY ou une session existante.
    let sub: { unsubscribe: () => void } | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setValidSession(true);
      setReady(true);
    })();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
        setReady(true);
      }
    });
    sub = data.subscription;
    return () => sub?.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (pw.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (pw !== pw2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const { error: ue } = await withTimeout(
        supabase.auth.updateUser({ password: pw }),
        10000,
        "la mise à jour du mot de passe",
      );
      if (ue) {
        setError(humanizeAuthError(ue));
        setBusy(false);
        return;
      }
      setDone(true);
      setInfo("Mot de passe mis à jour avec succès. Redirection…");
      const role = await resolveUserRole();
      await new Promise((r) => setTimeout(r, 800));
      if (role) {
        navigate({ to: dashboardPathForRole(role) });
      } else {
        await supabase.auth.signOut();
        navigate({ to: "/" });
      }
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title="Nouveau mot de passe">
      {!ready && <p className="text-sm text-muted-foreground">Vérification du lien…</p>}
      {ready && !validSession && !done && (
        <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
          Lien invalide ou expiré. Recommencez la procédure « mot de passe oublié »
          depuis la page de connexion.
        </div>
      )}
      {ready && validSession && (
        <>
          {error && (
            <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          {info && (
            <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <button disabled={busy || done} className="btn-bf-primary w-full">
              {busy ? "..." : "Définir mon nouveau mot de passe"}
            </button>
          </form>
        </>
      )}
    </PageShell>
  );
}
