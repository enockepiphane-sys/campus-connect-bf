import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { EspacesNavigation } from "./EspacesNavigation";
export function EspacesShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
      <Link to="/" className="flex items-center gap-3 font-display text-xl font-bold"><Logo className="h-9 w-9" />CampusLink</Link><HamburgerMenu />
    </div></header>
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Button asChild variant="ghost" className="mb-4"><Link to="/"><ArrowLeft />Accueil</Link></Button>
      <div className="kente-stripe mb-5 h-1 w-20" /><h1 className="break-words text-3xl font-bold sm:text-4xl">{title}</h1>
      <EspacesNavigation />{children}
    </main>
  </div>;
}
