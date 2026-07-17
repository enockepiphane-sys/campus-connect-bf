import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { humanizeAuthError } from "@/lib/auth-timeout";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    // Supabase détecte automatiquement le hash dans l'URL et crée une session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        } else if (event === "SIGNED_IN" && !ready) {
          // Certains cas arrivent avec SIGNED_IN au lieu de PASSWORD_RECOVERY
          setReady(true);
        }
      }
    );

    // Vérifier si une session existe déjà (lien déjà traité)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Attendre 3s max pour que Supabase traite le hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setReady(true);
            else setInvalid(true);
          });
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/" }), 3000);
  }

  if (invalid) {
    return (
      <PageShell title="Lien invalide">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
            ⚠️
          </div>
          <p className="text-foreground/80">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <p className="text-sm text-muted-foreground">
            Les liens de réinitialisation sont valables 1 heure. Faites une nouvelle demande.
          </p>
          <a
            href="/mot-de-passe-oublie"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white"
          >
            Nouvelle demande
          </a>
        </div>
      </PageShell>
    );
  }

  if (success) {
    return (
      <PageShell title="Mot de passe modifié">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✅
          </div>
          <p className="text-foreground/80">
            Votre mot de passe a été modifié avec succès.
          </p>
          <p className="text-sm text-muted-foreground">
            Vous allez être redirigé vers l'accueil dans 3 secondes…
          </p>
        </div>
      </PageShell>
    );
  }

  if (!ready) {
    return (
      <PageShell title="Vérification en cours…">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Nouveau mot de passe">
      <p className="mb-6 text-sm text-muted-foreground">
        Choisissez un nouveau mot de passe sécurisé (6 caractères minimum).
      </p>
      {error && (
        <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Nouveau mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-2"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Confirmer le mot de passe</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-2"
            placeholder="••••••••"
          />
        </div>
        <button disabled={busy} className="btn-bf-primary w-full">
          {busy ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </button>
      </form>
    </PageShell>
  );
}
