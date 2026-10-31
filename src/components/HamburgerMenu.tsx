import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Smartphone } from "lucide-react";
import { useInstall } from "@/components/InstallBanner";

const links = [
  { to: "/revision-ia", label: "Révision & IA" },
  { to: "/opportunites", label: "Opportunités" },
  { to: "/bibliotheque", label: "Bibliothèque" },
  { to: "/evenements", label: "Événements" },
  { to: "/fonctionnalites", label: "Fonctionnalités" },
  { to: "/cours-en-ligne", label: "Cours en ligne" },
  { to: "/devenir-partenaire", label: "Devenir partenaire" },
  { to: "/a-propos", label: "À propos de CampusLink" },
  { to: "/politique-confidentialite", label: "Politique de confidentialité" },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const { canPrompt, ios, standalone, install } = useInstall();

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
              {!standalone && (
                <li>
                  <button
                    type="button"
                    onClick={() => (canPrompt ? void install() : setHelp((v) => !v))}
                    className="flex w-full items-center gap-2 rounded-lg bg-primary-soft px-4 py-3 text-left font-semibold text-primary transition hover:brightness-95"
                  >
                    <Smartphone className="h-4 w-4" />
                    Installer l’application
                  </button>
                  {help && (
                    <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                      {ios
                        ? "Dans Safari, touchez le bouton Partager, puis « Sur l’écran d’accueil »."
                        : "Dans le menu de votre navigateur (⋮), choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »."}
                    </p>
                  )}
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
