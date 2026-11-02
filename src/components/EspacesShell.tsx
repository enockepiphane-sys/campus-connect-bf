import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { MarqueCampusLink } from "@/components/MarqueCampusLink";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { ESPACES } from "./espaces-themes";
import { RetourButtons } from "./RetourButtons";

export function EspacesShell({ title, children }: { title: string; children: ReactNode }) {
  // Le thème (couleurs, icône) dépend de la page affichée : aucune autre route à modifier.
  const { pathname } = useLocation();
  const espace = pathname.startsWith("/revision-ia") ? ESPACES.revision : pathname.startsWith("/bibliotheque") ? ESPACES.bibliotheque : pathname.startsWith("/cours-en-ligne") ? ESPACES.cours : pathname.startsWith("/guide-bachelier") ? ESPACES.guide : pathname.startsWith("/evenements") ? ESPACES.evenements : pathname.startsWith("/marche") ? ESPACES.marche : ESPACES.opportunites;
  const Icon = espace.Icon;
  const isGestion = pathname.startsWith("/gestion-opportunites");
  const subtitle = isGestion ? "Publie, modifie et retire les offres visibles par les étudiants." : espace.tagline;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <MarqueCampusLink className="text-xl sm:text-2xl" />
          </Link>
          <HamburgerMenu />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <RetourButtons />

        <section
          className="relative isolate overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-10"
          style={{ background: espace.gradient }}
        >
          <span aria-hidden className="absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-20 left-1/3 -z-10 h-48 w-48 rounded-full bg-black/10" />
          <Icon aria-hidden strokeWidth={1.1} className="absolute -bottom-10 -right-4 -z-10 h-64 w-64 text-white/15" />
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-8 w-8" />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-3xl font-bold sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{subtitle}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {espace.chips.map((c) => (
              <span key={c} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {c}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
