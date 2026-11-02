import { useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { Brain, Briefcase, ChevronRight, Compass, Handshake, Info, Library, Menu, MonitorPlay, PartyPopper, ShieldCheck, ShoppingBag, Smartphone, Sparkles, X } from "lucide-react";
import { useInstall } from "@/components/InstallBanner";

type Entry = { to: string; label: string; hint: string; Icon: ComponentType<{ className?: string }>; from: string; to2: string };

// Chaque entrée a son « sticker » : une pastille colorée avec une icône, pour reconnaître la fonctionnalité d'un coup d'œil.
const sections: { title: string; items: Entry[] }[] = [
  {
    title: "Pour les étudiants",
    items: [
      { to: "/guide-bachelier", label: "Guide du nouveau bachelier", hint: "Campus Faso, orientation, inscription", Icon: Compass, from: "#0b2a44", to2: "#4fb3e8" },
      { to: "/cours-en-ligne", label: "Cours en ligne", hint: "Par filière, niveau et module", Icon: MonitorPlay, from: "#9a3412", to2: "#e0764f" },
      { to: "/revision-ia", label: "Révision & IA", hint: "Résumés, QCM et fiches", Icon: Brain, from: "#052e1c", to2: "#12A150" },
      { to: "/opportunites", label: "Opportunités", hint: "Stages, bourses, emplois", Icon: Briefcase, from: "#c2410c", to2: "#F0C419" },
      { to: "/bibliotheque", label: "Bibliothèque", hint: "Livres, romans et cours", Icon: Library, from: "#0f5f5a", to2: "#2fb6a8" },
      { to: "/marche", label: "Marché étudiant", hint: "Livres, services, colocation", Icon: ShoppingBag, from: "#3b0764", to2: "#f59e0b" },
      { to: "/evenements", label: "Événements", hint: "L’agenda de la vie étudiante", Icon: PartyPopper, from: "#0b6b36", to2: "#F0C419" },
    ],
  },
  {
    title: "Découvrir CampusLink",
    items: [
      { to: "/fonctionnalites", label: "Fonctionnalités", hint: "Tout ce que fait l’application", Icon: Sparkles, from: "#b7791f", to2: "#F0C419" },
      { to: "/a-propos", label: "À propos de CampusLink", hint: "Qui sommes-nous ?", Icon: Info, from: "#1b4c37", to2: "#1d6fa5" },
      { to: "/devenir-partenaire", label: "Devenir partenaire", hint: "Université ou organisation", Icon: Handshake, from: "#0b6b36", to2: "#12A150" },
    ],
  },
  {
    title: "Informations",
    items: [{ to: "/politique-confidentialite", label: "Politique de confidentialité", hint: "Vos données protégées", Icon: ShieldCheck, from: "#1f2a25", to2: "#4a5a52" }],
  },
];

function Sticker({ Icon, from, to2 }: Pick<Entry, "Icon" | "from" | "to2">) {
  return (
    <span
      aria-hidden
      className="grid h-11 w-11 shrink-0 -rotate-3 place-items-center rounded-2xl text-white shadow-md ring-1 ring-black/10 transition duration-200 group-hover:rotate-0 group-hover:scale-105"
      style={{ background: `linear-gradient(135deg, ${from}, ${to2})` }}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

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
          <button aria-label="Fermer" onClick={() => setOpen(false)} className="flex-1 bg-foreground/40 backdrop-blur-sm" />
          <nav className="flex w-[22rem] max-w-full flex-col overflow-y-auto border-l border-border bg-surface p-5 shadow-2xl">
            <div className="kente-stripe mb-5 h-1.5 w-20 shrink-0 rounded-full" />
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <span className="font-display text-xl font-bold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sections.map((section) => (
              <div key={section.title} className="mb-4">
                <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{section.title}</p>
                <ul className="space-y-1">
                  {section.items.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-3 rounded-2xl px-2 py-2 text-foreground transition hover:bg-primary-soft"
                      >
                        <Sticker Icon={l.Icon} from={l.from} to2={l.to2} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold leading-tight">{l.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{l.hint}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {!standalone && (
              <div className="mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => (canPrompt ? void install() : setHelp((v) => !v))}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary-soft px-3 py-3 text-left transition hover:brightness-95"
                >
                  <Sticker Icon={Smartphone} from="#0b6b36" to2="#F0C419" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-tight text-primary">Installer l’application</span>
                    <span className="block text-xs text-muted-foreground">Accès rapide depuis votre téléphone</span>
                  </span>
                </button>
                {help && (
                  <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                    {ios
                      ? "Dans Safari, touchez le bouton Partager, puis « Sur l’écran d’accueil »."
                      : "Dans le menu de votre navigateur (⋮), choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil »."}
                  </p>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
