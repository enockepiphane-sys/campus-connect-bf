import { EspacesNavigation } from "@/components/EspacesNavigation";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { DrapeauBF } from "@/components/DrapeauBF";
import { Logo } from "@/components/Logo";
import { PhoneMockup } from "@/components/PhoneMockup";
import { EvenementsSociauxSection } from "@/components/EvenementsSociauxSection";
import graduateHero from "@/assets/graduate-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    <div className="bg-paper min-h-screen text-foreground">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Campus<span className="text-terracotta">Link</span>
            </span>
            <DrapeauBF className="h-5 w-8" />
          </div>
        </div>
        <HamburgerMenu />
      </header>

      {/* Kente accent */}
      <div className="kente-stripe mx-auto mt-2 h-1.5 w-full max-w-7xl rounded-full opacity-80" />

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="text-center md:text-left">
            <span className="inline-block rounded-full border border-primary/20 bg-primary-soft px-4 py-1 text-xs font-medium uppercase tracking-widest text-primary">
              Burkina Faso
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-foreground md:text-5xl">
              La vie universitaire, <br />
              <span className="text-gradient-bf">simplement connectée.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:mx-0">
              CampusLink relie les universités, leurs administrateurs et leurs
              étudiants du Burkina Faso : notes, annonces, emplois du temps et
              événements dans un espace sécurisé.
            </p>
          </div>
          <div className="relative mx-auto flex items-end justify-center px-2 sm:px-0">
            <img
              src={graduateHero}
              alt="Jeune diplômé universitaire africain présentant fièrement l'application CampusLink"
              width={1024}
              height={1536}
              className="relative z-0 max-h-[240px] w-auto sm:max-h-[300px] md:max-h-[420px] -mr-6 sm:-mr-10 md:-mr-24"
            />
            <div className="relative z-10">
              <PhoneMockup />
            </div>
          </div>
        </div>

        {/* Accès étudiant */}
        <div className="mx-auto mt-16 grid max-w-2xl gap-6">
          {/* Étudiant */}
          <section className="card-glass group rounded-2xl p-8 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary-soft text-primary">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Espace Étudiant
                </h2>
                <p className="text-sm text-muted-foreground">
                  Notes, annonces, emploi du temps
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/etudiant/inscription" className="btn-bf-primary">
                <UserPlus className="h-4 w-4" />
                S'inscrire au compte étudiant
              </Link>
              <Link to="/etudiant/connexion" className="btn-bf-outline">
                <LogIn className="h-4 w-4" />
                Se connecter au compte étudiant
              </Link>
            </div>
          </section>
        </div>


        <div className="mx-auto mt-10 max-w-2xl"><EspacesNavigation /></div>

        {/* Événements sociaux */}
        <EvenementsSociauxSection />

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <Logo className="h-10 w-10" />
          <p className="text-center text-xs text-muted-foreground">
            CampusLink — Une plateforme pensée pour les campus du Burkina Faso 🇧🇫
          </p>
        </div>
      </main>
    </div>
  );
}
