import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ESPACES, type EspaceKey } from "./espaces-themes";

const KEYS: Exclude<EspaceKey, "evenements">[] = ["guide", "cours", "revision", "opportunites", "bibliotheque", "marche"];

// variant "compact" (défaut) : petites palettes côte à côte (accueil, espaces étudiant et super admin)
// variant "switch"  : sélecteur en pastilles
// variant "cards"   : grandes cartes détaillées
export function EspacesNavigation({ variant = "compact" }: { variant?: "compact" | "switch" | "cards" }) {
  if (variant === "switch") {
    return (
      <nav aria-label="Espaces CampusLink" className="my-5 flex flex-wrap gap-2">
        {KEYS.map((k) => {
          const e = ESPACES[k];
          const Icon = e.Icon;
          return (
            <Link
              key={k}
              to={e.to}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted data-[status=active]:border-transparent data-[status=active]:text-white"
              activeProps={{ style: { background: e.gradient } }}
            >
              <Icon className="h-4 w-4" />
              {e.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  if (variant === "cards") {
    return (
      <nav aria-label="Espaces CampusLink" className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KEYS.map((k) => {
          const e = ESPACES[k];
          const Icon = e.Icon;
          return (
            <Link key={k} to={e.to} className="group relative isolate flex min-h-[200px] flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl" style={{ background: e.gradient }}>
              <Icon aria-hidden strokeWidth={1.1} className="absolute -bottom-8 -right-6 -z-10 h-44 w-44 text-white/15" />
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold">{e.label}</h2>
                <p className="mt-1 text-sm text-white/85">{e.tagline}</p>
              </div>
            </Link>
          );
        })}
      </nav>
    );
  }

  // compact
  return (
    <nav aria-label="Espaces CampusLink" className="my-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
      {KEYS.map((k, i) => {
        const e = ESPACES[k];
        const Icon = e.Icon;
        return (
          <Link
            key={k}
            to={e.to}
            data-guide={k}
            className={`${i === 0 || (i === KEYS.length - 1 && KEYS.length % 2 === 0) ? "col-span-2 sm:col-span-1 " : ""}group relative isolate flex min-h-[104px] flex-col justify-between overflow-hidden rounded-2xl p-3 text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-[116px] sm:p-4`}
            style={{ background: e.gradient }}
          >
            <span aria-hidden className="absolute -right-5 -top-5 -z-10 h-20 w-20 rounded-full bg-white/10" />
            <Icon aria-hidden strokeWidth={1.2} className="absolute -bottom-3 -right-2 -z-10 h-20 w-20 text-white/15 transition duration-300 group-hover:rotate-6 group-hover:scale-110" />
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur-sm sm:h-10 sm:w-10">
              <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
            </span>
            <span className="mt-2 flex items-end justify-between gap-1">
              <span className="font-display text-[13px] font-bold leading-tight sm:text-base">{e.short}</span>
              <ArrowRight className="hidden h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 sm:block" />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
