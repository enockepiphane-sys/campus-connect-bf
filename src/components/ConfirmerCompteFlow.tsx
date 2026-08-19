import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { withTimeout, humanizeAuthError } from "@/lib/auth-timeout";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";

type Etape = "verification" | "mot-de-passe" | "erreur";

export function ConfirmerCompteFlow() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState<Etape>("verification");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Étape 1 : on vérifie le lien du mail (token_hash). Contrairement à
  // l'ancien flux, on GARDE la session ouverte après verifyOtp : c'est
  // justement cette session, obtenue uniquement en cliquant sur le lien
  // reçu par email, qui prouve que la personne est bien titulaire de la
  // boîte mail. Elle sert ensuite à définir le mot de passe pour la
  // première fois (le compte a été créé avec un mot de passe aléatoire
  // que personne ne connaît, voir etudiant.inscription.tsx / admin.inscription.tsx).
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (!tokenHash || !type) {
        setError("Lien invalide ou incomplet.");
        setEtape("erreur");
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "signup" | "email_change",
      });

      if (verifyError) {
        setError(humanizeAuthError(verifyError));
        setEtape("erreur");
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? "");

      history.replaceState(null, "", window.location.pathname);
      setEtape("mot-de-passe");
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setBusy(false);
      return;
    }
    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      setBusy(false);
      return;
    }
    try {
      // On utilise la session ouverte par verifyOtp pour définir le
      // mot de passe pour la première fois — pas signInWithPassword,
      // qui supposerait qu'un mot de passe utilisable existe déjà.
      const { error: ue } = await withTimeout(
        supabase.auth.updateUser({ password }),
        10000, "la définition du mot de passe",
      );
      if (ue) { setError(humanizeAuthError(ue)); setBusy(false); return; }

      const role = await withTimeout(resolveUserRole(), 10000, "la vérification du rôle");
      if (!role) {
        await supabase.auth.signOut();
        setError("Compte confirmé, mais aucun espace trouvé. Contactez l'administration.");
        setBusy(false);
        return;
      }

      navigate({ to: dashboardPathForRole(role) });
    } catch (err) {
      setError(humanizeAuthError(err));
      setBusy(false);
    }
  }

  return (
    <PageShell title="Confirmation du compte">
      {etape === "verification" && (
        <p className="text-sm text-muted-foreground">Vérification du lien en cours…</p>
      )}

      {etape === "erreur" && error && (
        <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {etape === "mot-de-passe" && (
        <>
          <p className="mb-4 text-sm text-primary">✓ Lien vérifié. Définissez votre mot de passe pour activer votre compte.</p>
          {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <input type="email" disabled value={email}
                className="w-full rounded border border-input bg-muted px-3 py-2 text-muted-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Mot de passe</label>
              <input type="password" required autoFocus minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Confirmez le mot de passe</label>
              <input type="password" required minLength={6} value={password2} onChange={(e) => setPassword2(e.target.value)}
                className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
            </div>
            <button disabled={busy} className="btn-bf-primary w-full">{busy ? "..." : "Confirmer et accéder à mon espace"}</button>
          </form>
        </>
      )}
    </PageShell>
  );
}
