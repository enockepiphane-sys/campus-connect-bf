import { createFileRoute, Link } from "@tanstack/react-router";
import { Copyright } from "@/components/Copyright";
import {
  GraduationCap,
  Megaphone,
  Calendar,
  Clock,
  Users,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  UserPlus,
  LogIn,
  Building2,
  FileSpreadsheet,
  Brain,
  Briefcase,
  Library,
  PartyPopper,
  Smartphone,
  Bell,
  BarChart3,
  Settings2,
} from "lucide-react";

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — CampusLink" },
      {
        name: "description",
        content:
          "Découvrez les fonctionnalités de CampusLink pour les universités du Burkina Faso.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="bg-paper min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="kente-stripe mb-6 h-1.5 w-24 rounded-full" />
        <h1 className="mb-3 text-4xl font-bold text-gradient-bf">Fonctionnalités</h1>
        <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
          CampusLink met à disposition des universités et étudiants du Burkina Faso
          une suite d'outils simples et sécurisés pour gérer la vie académique au quotidien.
        </p>

        {/* Outils disponibles */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">Outils disponibles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<ClipboardList className="h-6 w-6" />}
              title="Gestion des notes"
              desc="Import des notes par matière via CSV. Chaque étudiant consulte uniquement ses propres résultats, avec le calcul automatique des moyennes."
              color="primary"
            />
            <FeatureCard
              icon={<Megaphone className="h-6 w-6" />}
              title="Annonces"
              desc="Diffusion d'annonces ciblées par niveau et filière. Les étudiants reçoivent en temps réel les informations de leur établissement."
              color="accent"
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Événements"
              desc="Publication d'événements (examens, conférences, activités) visibles par les étudiants d'un niveau/filière donné."
              color="gold"
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Emploi du temps"
              desc="Création de créneaux hebdomadaires (jour, heure, salle, enseignant). L'emploi du temps est affiché jour par jour pour chaque niveau."
              color="primary"
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Listes étudiantes"
              desc="Import des listes officielles d'étudiants par niveau via CSV. Seuls les étudiants pré-inscrits peuvent créer un compte."
              color="accent"
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Filières & niveaux"
              desc="Les administrateurs structurent leur établissement en filières et niveaux. Chaque niveau dispose d'un espace isolé et indépendant."
              color="gold"
            />
          </div>
        </section>

        {/* Nouveau : outils ouverts à tous */}
        <section className="mb-12">
          <h2 className="mb-2 text-xl font-bold text-foreground">Ouvert à tous les étudiants, sans compte</h2>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
            Même si votre université n'est pas encore partenaire de CampusLink, vous pouvez utiliser ces outils gratuitement.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StickerCard
              icon={<Brain className="h-6 w-6" />}
              title="Révision & IA"
              desc="Importez un cours en PDF ou en photo (même manuscrit) et obtenez un résumé, un QCM, des fiches de révision ou des exercices corrigés. Posez aussi vos questions à l'assistant."
              from="#052e1c"
              to2="#12A150"
              link="/revision-ia"
              badge="Nouveau"
            />
            <StickerCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Opportunités"
              desc="Stages, offres d'emploi, bourses d'études, concours, formations et appels à candidatures, avec la date limite. Les comptes connectés peuvent enregistrer leurs favoris."
              from="#c2410c"
              to2="#F0C419"
              link="/opportunites"
              badge="Nouveau"
            />
            <StickerCard
              icon={<Library className="h-6 w-6" />}
              title="Bibliothèque"
              desc="Romans, récits, supports de cours et livres classés par thème. Recherchez, lisez en ligne ou téléchargez, et proposez un livre à ajouter."
              from="#0f5f5a"
              to2="#2fb6a8"
              link="/bibliotheque"
              badge="Nouveau"
            />
            <StickerCard
              icon={<PartyPopper className="h-6 w-6" />}
              title="Événements sociaux"
              desc="L'agenda des concerts, conférences et activités : recherche, filtres (cette semaine, ce mois-ci), affiches en grand format et partage en un clic."
              from="#0b6b36"
              to2="#F0C419"
              link="/evenements"
              badge="Nouveau"
            />
            <StickerCard
              icon={<Smartphone className="h-6 w-6" />}
              title="Application installable"
              desc="Installez CampusLink sur l'écran d'accueil de votre téléphone pour y accéder en un clic, comme une application, sans passer par le navigateur."
              from="#0b6b36"
              to2="#F0C419"
              badge="Nouveau"
            />
            <StickerCard
              icon={<Bell className="h-6 w-6" />}
              title="Notifications"
              desc="Les utilisateurs connectés peuvent activer les alertes de l'application pour être prévenus directement sur leur téléphone."
              from="#b7791f"
              to2="#F0C419"
            />
          </div>
        </section>

        {/* Nouveau : côté équipe CampusLink */}
        <section className="mb-12">
          <h2 className="mb-2 text-xl font-bold text-foreground">Côté équipe CampusLink</h2>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">Les outils de gestion qui alimentent ces nouveautés.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StickerCard
              icon={<Settings2 className="h-6 w-6" />}
              title="Gestion des opportunités"
              desc="Les administrateurs autorisés publient, modifient et retirent les offres visibles par les étudiants."
              from="#9a3412"
              to2="#e0764f"
            />
            <StickerCard
              icon={<Library className="h-6 w-6" />}
              title="Gestion de la bibliothèque"
              desc="Le super administrateur ajoute les livres et cours par thème (PDF ou photos) et examine les livres proposés par les étudiants."
              from="#0f5f5a"
              to2="#2fb6a8"
            />
            <StickerCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Statistiques de fréquentation"
              desc="Le nombre de visiteurs par jour, semaine et mois, et l'usage de chaque outil, calculés de façon anonyme."
              from="#1f2a25"
              to2="#4a5a52"
            />
          </div>
        </section>

        {/* Comment s'inscrire (étudiant) */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            Comment un étudiant s'inscrit et se connecte
          </h2>
          <div className="card-glass rounded-2xl p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <StepBlock
                step="1"
                icon={<Building2 className="h-5 w-5" />}
                title="Choisir l'établissement"
                desc="L'étudiant sélectionne son université parmi les établissements actifs."
              />
              <StepBlock
                step="2"
                icon={<BookOpen className="h-5 w-5" />}
                title="Sélectionner filière & niveau"
                desc="L'étudiant choisit sa filière puis son niveau d'étude."
              />
              <StepBlock
                step="3"
                icon={<UserPlus className="h-5 w-5" />}
                title="Saisir ses informations"
                desc="Nom complet, email et date de naissance — vérifiés contre la liste pré-inscrite par l'administration."
              />
              <StepBlock
                step="4"
                icon={<LogIn className="h-5 w-5" />}
                title="Créer son mot de passe"
                desc="Après vérification, l'étudiant crée son mot de passe et accède à son espace personnel."
              />
            </div>
          </div>
        </section>

        {/* Comment un admin gère */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            Comment un administrateur gère son établissement
          </h2>
          <div className="card-glass rounded-2xl p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <StepBlock
                step="1"
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Pré-autorisation"
                desc="Le super administrateur pré-autorise l'administrateur de l'établissement (nom, email, date de naissance)."
              />
              <StepBlock
                step="2"
                icon={<Building2 className="h-5 w-5" />}
                title="Inscription administrateur"
                desc="L'admin s'inscrit en vérifiant son identité contre la pré-autorisation, puis crée son mot de passe."
              />
              <StepBlock
                step="3"
                icon={<FileSpreadsheet className="h-5 w-5" />}
                title="Structurer & importer"
                desc="L'admin crée filières, niveaux, matières, importe les listes d'étudiants et les notes via CSV."
              />
              <StepBlock
                step="4"
                icon={<Megaphone className="h-5 w-5" />}
                title="Communiquer"
                desc="L'admin publie annonces, événements et emplois du temps ciblés par niveau/filière."
              />
            </div>
          </div>
        </section>

        {/* Sécurité */}
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

        {/* Lien accueil */}
        <div className="text-center">
          <a href="/" className="btn-bf-outline">Retour à l'accueil</a>
        </div>

        <Copyright className="mt-10 border-t border-border pt-6" />
      </div>
    </div>
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
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${bg}`}>
        {icon}
      </div>
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
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">
          <span className="mr-1 text-primary">{step}.</span> {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function StickerCard({
  icon,
  title,
  desc,
  from,
  to2,
  link,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  from: string;
  to2: string;
  link?: string;
  badge?: string;
}) {
  const card = (
    <div className="card-glass group relative h-full rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-[#F0C419] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-900">
          {badge}
        </span>
      )}
      <div
        className="mb-4 grid h-12 w-12 -rotate-3 place-items-center rounded-2xl text-white shadow-md ring-1 ring-black/10 transition duration-200 group-hover:rotate-0"
        style={{ background: `linear-gradient(135deg, ${from}, ${to2})` }}
      >
        {icon}
      </div>
      <h3 className="mb-2 font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      {link && <p className="mt-3 text-sm font-semibold text-primary">Découvrir →</p>}
    </div>
  );
  return link ? (
    <Link to={link} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}
