import { Link } from "@tanstack/react-router";
import { ESPACES, type EspaceKey } from "./espaces-themes";

const KEYS: Exclude<EspaceKey, "evenements">[] = ["marche", "bibliotheque", "opportunites", "revision", "cours", "guide"];

// Bande défilante colorée des fonctionnalités de l'accueil (pause au survol / au toucher).
export function BandeDefilante() {
  const items = [...KEYS, ...KEYS];
  return (
    <div className="relative overflow-hidden py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]" aria-label="Fonctionnalités CampusLink">
      <div className="marquee-track flex w-max gap-3">
        {items.map((k, i) => {
          const e = ESPACES[k];
          const Icon = e.Icon;
          return (
            <Link key={`${k}-${i}`} to={e.to} aria-hidden={i >= KEYS.length} tabIndex={i >= KEYS.length ? -1 : undefined}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
              style={{ background: e.gradient }}>
              <Icon className="h-4 w-4" />
              {e.label}
              <span className="hidden font-normal text-white/85 sm:inline">· {e.tagline}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
