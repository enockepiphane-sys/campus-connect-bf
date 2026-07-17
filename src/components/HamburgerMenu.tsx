import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { humanizeAuthError } from "@/lib/auth-timeout";

const links = [
  { to: "/fonctionnalites", label: "Fonctionnalités" },
  { to: "/cours-en-ligne", label: "Cours en ligne" },
  { to: "/devenir-partenaire", label: "Devenir partenaire" },
  { to: "/politique-confidentialite", label: "Politique de confidentialité" },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-primary shadow-sm transition hover:bg-primary-soft"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <button
            aria-label="Fermer"
            onClick={() => { setOpen(false); setShowSuperAdmin(false); }}
            className="flex-1 bg-foreground/40 backdrop-blur-sm"
          />
          <nav className="flex w-80 max-w-full flex-col border-l border-border bg-surface p-6 shadow-2xl">
            <div className="kente-stripe mb-6 h-1.5 w-20 rounded-full" />
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => { setOpen(false); setShowSuperAdmin(false); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-foreground/80 transition hover:bg-primary-soft hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Point d'accès discret super admin */}
            <div className="mt-auto pt-8">
              <button
                type="button"
                aria-label="Accès réservé"
                onClick={() => setShowSuperAdmin(true)}
                className="mx-auto block h-2 w-2 rounded-full bg-muted-foreground/30 transition hover:bg-primary"
                title=""
              />
            </div>
          </nav>
        </div>
      )}

      {showSuperAdmin && open && (
        <SuperAdminModal onClose={() => { setShowSuperAdmin(false); setOpen(false); }} />
      )}
    </>
  );
}

function SuperAdminModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="kente-stripe mb-4 h-1.5 w-16 rounded-full" />
        <h3 className="mb-4 text-lg font-semibold text-foreground">Espace Super Administrateur</h3>
        <LoginForm />
        <button onClick={onClose} className="mt-4 w-full text-center text-xs text-muted-foreground underline">
          Fermer
        </button>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !signInData.user) {
      setError(humanizeAuthError(signInError ?? new Error("Connexion échouée")));
      setBusy(false);
      return;
    }

    // Vérification directe côté client : l'email doit exister dans super_admins
    const { data: sa, error: saError } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", signInData.user.id)
      .maybeSingle();

    if (saError || !sa) {
      await supabase.auth.signOut();
      setError("Accès non autorisé");
      setBusy(false);
      return;
    }

    navigate({ to: "/super-admin" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Field label="Email" type="email" value={email} onChange={setEmail} />
      <div>
        <Field label="Mot de passe" type="password" value={password} onChange={setPassword} />
        <div className="mt-1 text-right">
          <a href="/mot-de-passe-oublie" className="text-xs text-primary underline">Mot de passe oublié ?</a>
        </div>
      </div>
      <button type="submit" disabled={busy} className="btn-bf-primary w-full disabled:opacity-60">
        {busy ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-foreground/80">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary"
      />
    </div>
  );
}
