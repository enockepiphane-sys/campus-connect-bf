import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Briefcase, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/Logo";
import { DrapeauBF } from "@/components/DrapeauBF";

// Page dédiée à l'inscription / connexion PRIMAIRE : aucune interface d'espace (pas de badges Opportunités).
export function PageAuth({ titre, sousTitre, children }: { titre: string; sousTitre: string; children: ReactNode }) {
  return (
    <div className="bg-paper flex min-h-screen flex-col text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="font-display text-xl font-bold">Campus<span className="text-terracotta">Link</span></span>
          <DrapeauBF className="h-4 w-6" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Accueil
        </Link>
      </header>
      <main className="mx-auto grid grid-cols-1 w-full max-w-5xl flex-1 items-center gap-10 px-5 pb-12 md:grid-cols-2 [&>*]:min-w-0">
        <section className="hidden md:block">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Un seul compte,<br /><span className="text-gradient-bf">tout ton campus.</span>
          </h2>
          <ul className="mt-8 space-y-4 text-muted-foreground">
            <li className="flex items-center gap-3"><ShoppingBag className="h-5 w-5 text-primary" />Marché étudiant : acheter, vendre, échanger</li>
            <li className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary" />Bibliothèque, cours en ligne et révision IA</li>
            <li className="flex items-center gap-3"><Briefcase className="h-5 w-5 text-primary" />Bourses, stages, emplois et concours</li>
          </ul>
        </section>
        <section className="card-glass w-full rounded-3xl p-6 shadow-[var(--shadow-elegant)] sm:p-8">
          <div className="kente-stripe mb-6 h-1.5 w-16 rounded-full" />
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{titre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sousTitre}</p>
          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  );
}
