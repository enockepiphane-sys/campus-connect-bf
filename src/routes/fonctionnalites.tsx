import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  Megaphone,
  Calendar,
  Clock,
  Users,
  BookOpen,
  ShieldCheck,
  UserPlus,
  LogIn,
  Building2,
  FileSpreadsheet,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — CampusLink" },
      {
        name: "description",
        content: "Découvrez les fonctionnalités de CampusLink pour les universités du Burkina Faso.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="Fonctionnalités">
      <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
        CampusLink met à disposition des universités et étudiants du Burkina Faso
        une suite d'outils simples et sécurisés pour gérer la vie académique au quotidien.
      </p>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-foreground">Outils disponibles</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={<ClipboardList className="h-6 w-6" />} title="Gestion des notes" desc="Import des notes par matière via CSV. Chaque étudiant consulte uniquement ses propres résultats, avec le calcul automatique des moyennes." color="primary" />
          <FeatureCard icon={<Megaphone className="h-6 w-6" />} title="Annonces" desc="Diffusion d'annonces ciblées par niveau et filière. Les étudiants reçoivent en temps réel les informations de leur établissement." color="accent" />
          <FeatureCard icon={<Calendar className="h-6 w-6" />} title="Événements" desc="Publication d'événements (examens, conférences, activités) visibles par les étudiants d'un niveau/filière donné." color="gold" />
          <FeatureCard icon={<Clock className="h-6 w-6" />} title="Emploi du temps" desc="Création de créneaux hebdomadaires (jour, heure, salle, enseignant). L'emploi du temps est affiché jour par jour pour chaque niveau." color="primary" />
          <FeatureCard icon={<Users className="h-6 w-6" />} title="Listes étudiantes" desc="Import des listes officielles d'étudiants par niveau via CSV. Seuls les étudiants pré-inscrits peuvent créer un compte." color="accent" />
          <FeatureCard icon={<BookOpen className="h-6 w-6" />} title="Filières & niveaux" desc="Les administrateurs structurent leur établissement en filières et niveaux. Chaque niveau dispose d'un espace isolé et indépendant." color="gold" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-foreground">Comment un étudiant s'inscrit et se connecte</h2>
        <div className="card-glass rounded-2xl p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <StepBlock step="1" icon={<Building2 className="h-5 w-5" />} title="Choisir l'établissement" desc="L'étudiant sélectionne son université parmi les établissements actifs." />
            <StepBlock step="2" icon={<BookOpen className="h-5 w-5" />} title="Sélectionner filière & niveau" desc="L'étudiant choisit sa filière puis son niveau d'étude." />
            <StepBlock step="3" icon={<UserPlus className="h-5 w-5" />} title="Saisir ses informations" desc="Nom complet, email et date de naissance — vérifiés contre la liste pré-inscrite par l'administration." />
            <StepBlock step="4" icon={<LogIn className="h-5 w-5" />} title="Créer son mot de passe" desc="Après vérification, l'étudiant crée son mot de passe et accède à son espace personnel." />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-foreground">Comment un administrateur gère son établissement</h2>
        <div className="card-glass rounded-2xl p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <StepBlock step="1" icon={<ShieldCheck className="h-5 w-5" />} title="Pré-autorisation" desc="Le super administrateur pré-autorise l'administrateur de l'établissement (nom, email, date de naissance)." />
            <StepBlock step="2" icon={<Building2 className="h-5 w-5" />} title="Inscription administrateur" desc="L'admin s'inscrit en vérifiant son identité contre la pré-autorisation, puis crée son mot de passe." />
            <StepBlock step="3" icon={<FileSpreadsheet className="h-5 w-5" />} title="Structurer & importer" desc="L'admin crée filières, niveaux, matières, importe les listes d'étudiants et les notes via CSV." />
            <StepBlock step="4" icon={<Megaphone className="h-5 w-5" />} title="Communiquer" desc="L'admin publie annonces, événements et emplois du temps ciblés par niveau/filière." />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="card-glass rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Sécurité & confidentialité</h2>
              <p className="text-sm text-muted-foreground">
                Chaque étudiant ne voit que ses propres notes. Les annonces, événements et
                emplois du temps sont limités à son niveau et sa filière. Les administrateurs
                ne peuvent accéder qu'aux données de leur propre établissement. Les données
                sensibles ne sont jamais publiques.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "primary" | "accent" | "gold";
}) {
  const bg = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent text-accent-foreground",
    gold: "bg-gold/20 text-gold-foreground",
  }[color];

  return (
    <div className="card-glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${bg}`}>{icon}</div>
      <h3 className="mb-2 font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function StepBlock({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">{icon}</div>
      <div>
        <h3 className="font-semibold text-foreground">
          <span className="mr-1 text-primary">{step}.</span> {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
