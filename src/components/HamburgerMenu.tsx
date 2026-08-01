import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/fonctionnalites", label: "Fonctionnalités" },
  { to: "/cours-en-ligne", label: "Cours en ligne" },
  { to: "/devenir-partenaire", label: "Devenir partenaire" },
  { to: "/politique-confidentialite", label: "Politique de confidentialité" },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

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
          </nav>
        </div>
      )}
    </>
  );
}
