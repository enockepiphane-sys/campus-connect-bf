import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";

export const Route = createFileRoute("/super-admin-acces")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const role = await resolveUserRole();
      if (role === "super_admin") navigate({ to: "/super-admin" });
    })();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setStatus("loading");

    if (mode === "signup") {
      const { error: se } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/super-admin-acces` },
      });
      if (se) { setError(se.message); setStatus("idle"); return; }
      setInfo("Compte créé. Si la confirmation par email est activée, vérifiez votre boîte, puis connectez-vous.");
      setMode("login");
      setStatus("idle");
      return;
    }

    const { data: signInData, error: le } = await supabase.auth.signInWithPassword({ email, password });
    if (le) { setError(le.message); setStatus("idle"); return; }

    const token = signInData.session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
    if (!token || token.split(".").length !== 3) {
      await supabase.auth.signOut();
      setError("Session invalide. Reconnectez-vous.");
      setStatus("idle");
      return;
    }

    // Vérifier que l'email est bien dans super_admins et grant du rôle si besoin
    const res = await fetch("/api/super-admin/ensure-role", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: token }),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (!json.ok) {
      await supabase.auth.signOut();
      setError("Accès non autorisé.");
      setStatus("idle");
      return;
    }
    navigate({ to: dashboardPathForRole("super_admin") });
  }

  return (
    <PageShell title="Accès Super Administrateur">
      <p className="mb-6 text-sm text-muted-foreground">
        Espace réservé. Utilisez l'email référencé comme super administrateur.
      </p>

      {error && <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded-lg border border-primary/30 bg-primary-soft p-3 text-sm text-primary">{info}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mot de passe</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
        </div>
        <button type="submit" disabled={status === "loading"} className="btn-bf-primary w-full disabled:opacity-60">
          {status === "loading" ? "..." : mode === "login" ? "Se connecter" : "Créer le compte super admin"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        {mode === "login" ? (
          <button className="text-primary underline" onClick={() => setMode("signup")}>Première connexion ? Créer le compte</button>
        ) : (
          <button className="text-primary underline" onClick={() => setMode("login")}>J'ai déjà un compte</button>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-xs text-muted-foreground underline">Retour à l'accueil</Link>
      </div>
    </PageShell>
  );
}
