import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { authenticateUser } from "@/lib/auth";

const links = [
  { to: "/fonctionnalites", label: "Fonctionnalités" },
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

      {open && !showSuperAdmin && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <button
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="flex-1 bg-foreground/40 backdrop-blur-sm"
          />
          <nav className="flex w-80 max-w-full flex-col border-l border-border bg-surface p-6 shadow-2xl">
            <div className="kente-stripe mb-6 h-1.5 w-20 rounded-full" />
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
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

            {/* Discreet super admin access — tiny dot at the very bottom */}
            <div className="mt-auto pt-8">
              <button
                type="button"
                aria-label="."
                onClick={() => setShowSuperAdmin(true)}
                className="mx-auto block h-2 w-2 rounded-full bg-muted-foreground/30 transition hover:bg-primary"
              />
            </div>
          </nav>
        </div>
      )}

      {showSuperAdmin && (
        <SuperAdminLogin onClose={() => { setShowSuperAdmin(false); setOpen(false); }} />
      )}
    </>
  );
}

function SuperAdminLogin({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // Uses the EXACT SAME authenticateUser function as the normal login form.
    // expectedRole = "super_admin" ensures only super admins can access.
    const result = await authenticateUser(email, password, "super_admin");

    if (!result.ok) {
      setError(result.error || "Accès non autorisé");
      setBusy(false);
      return;
    }

    navigate({ to: "/super-admin" });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="kente-stripe mb-4 h-1.5 w-16 rounded-full" />
        <h3 className="mb-4 text-lg font-semibold text-foreground">Accès réservé</h3>
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-foreground/80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-paper px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-foreground/80">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-paper px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-bf-primary w-full disabled:opacity-60">
            {busy ? "..." : "Se connecter"}
          </button>
        </form>
        <button onClick={onClose} className="mt-3 w-full text-center text-xs text-muted-foreground underline">
          Annuler
        </button>
      </div>
    </div>
  );
}
