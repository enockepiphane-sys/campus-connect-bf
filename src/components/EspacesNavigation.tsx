import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ESPACES, type EspaceKey } from "./espaces-themes";

const KEYS: EspaceKey[] = ["revision", "opportunites"];

// variant "cards"  : grandes palettes cliquables (accueil, espaces étudiant/admin)
// variant "switch" : petit sélecteur compact (à l'intérieur des pages Révision / Opportunités)
export function EspacesNavigation({ variant = "cards" }: { variant?: "cards" | "switch" }) {
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

  return (
    <nav aria-label="Espaces CampusLink" className="my-6 grid gap-4 sm:grid-cols-2">
      {KEYS.map((k) => {
        const e = ESPACES[k];
        const Icon = e.Icon;
        return (
          <Link
            key={k}
            to={e.to}
            className="group relative isolate flex min-h-[210px] flex-col justify-between overflow-hidden rounded-3xl p-6 text-left text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-[240px] sm:p-7"
            style={{ background: e.gradient }}
          >
            <span aria-hidden className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-white/10" />
            <span aria-hidden className="absolute -bottom-16 -left-10 -z-10 h-40 w-40 rounded-full bg-black/10" />
            <Icon
              aria-hidden
              strokeWidth={1.1}
              className="absolute -bottom-8 -right-6 -z-10 h-48 w-48 text-white/15 transition duration-500 group-hover:rotate-6 group-hover:scale-110"
            />

            <div className="flex items-start justify-between gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-sm">
                <Icon className="h-7 w-7" />
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
                Nouveau
              </span>
            </div>

            <div className="mt-6">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{e.label}</h2>
              <p className="mt-2 max-w-sm text-sm text-white/85 sm:text-base">{e.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {e.chips.map((c) => (
                    <span key={c} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                      {c}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 transition group-hover:gap-3">
                  Ouvrir
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
