import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, LogIn, UserPlus } from "lucide-react";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { DrapeauBF } from "@/components/DrapeauBF";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusLink — La plateforme des campus du Burkina Faso" },
      {
        name: "description",
        content:
          "CampusLink connecte les universités, administrateurs et étudiants du Burkina Faso : annonces, emplois du temps, notes et événements en un seul espace.",
      },
      { property: "og:title", content: "CampusLink — Campus du Burkina Faso" },
      {
        property: "og:description",
        content:
          "La plateforme dédiée aux universités et étudiants du Burkina Faso.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="bg-stripes-bf min-h-screen text-white">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-bold shadow-lg">
            C
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              Campus<span className="text-emerald-400">Link</span>
            </span>
            <DrapeauBF className="h-5 w-8" />
          </div>
        </div>
        <HamburgerMenu />
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-16">
        <div className="text-center">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-emerald-300">
            Burkina Faso
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            La vie universitaire, <br />
            <span className="text-gradient-bf">simplement connectée.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            CampusLink relie les universités, leurs administrateurs et leurs
            étudiants du Burkina Faso : notes, annonces, emplois du temps et
            événements dans un espace sécurisé.
          </p>
        </div>

        {/* Deux blocs d'accès */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          {/* Étudiant */}
          <section className="card-glass group rounded-2xl p-8 transition hover:border-emerald-400/40">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Espace Étudiant
                </h2>
                <p className="text-sm text-white/60">
                  Notes, annonces, emploi du temps
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/etudiant/inscription" className="btn-bf-primary">
                <UserPlus className="h-4 w-4" />
                S'inscrire au compte étudiant
              </Link>
              <Link to="/etudiant/connexion" className="btn-bf-outline hover:bg-white/5">
                <LogIn className="h-4 w-4" />
                Se connecter au compte étudiant
              </Link>
            </div>
          </section>

          {/* Administrateur */}
          <section className="card-glass group rounded-2xl p-8 transition hover:border-emerald-400/40">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-amber-500/15 text-amber-300">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Espace Administrateur
                </h2>
                <p className="text-sm text-white/60">
                  Filières, niveaux, listes étudiantes
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/admin/inscription" className="btn-bf-primary">
                <UserPlus className="h-4 w-4" />
                S'inscrire à mon compte administrateur
              </Link>
              <Link to="/admin/connexion" className="btn-bf-outline hover:bg-white/5">
                <LogIn className="h-4 w-4" />
                Se connecter à mon compte administrateur
              </Link>
            </div>
          </section>
        </div>

        <p className="mt-16 text-center text-xs text-white/40">
          CampusLink — Une plateforme pensée pour les campus du Burkina Faso 🇧🇫
        </p>
      </main>
    </div>
  );
}
