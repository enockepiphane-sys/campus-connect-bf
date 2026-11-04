import { Copyright } from "@/components/Copyright";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos de CampusLink — Plateforme des campus du Burkina Faso" },
      {
        name: "description",
        content:
          "Découvrez CampusLink : cours en ligne, bibliothèque, opportunités, marché étudiant et espaces universitaires réunis pour les étudiants du Burkina Faso.",
      },
      { property: "og:title", content: "À propos de CampusLink" },
      {
        property: "og:description",
        content:
          "L'histoire, la mission et l'équipe derrière CampusLink, la plateforme des campus du Burkina Faso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="À propos de CampusLink">
      <p className="">
        CampusLink est né d'un constat simple : au Burkina Faso, la vie universitaire est souvent éparpillée. Les annonces circulent dans des groupes WhatsApp, les emplois du temps sont affichés sur des tableaux que tout le monde ne voit pas, les notes passent par des feuilles Excel, et les bons cours, les bons livres ou les bonnes opportunités dépendent trop souvent des contacts que l'on a.
      </p>
      <p className="mt-4">
        Notre ambition est de réunir tout cela au même endroit : une plateforme moderne, simple et gratuite pour les étudiants, qui fonctionne aussi bien sur un téléphone d'entrée de gamme que sur un ordinateur, dans le navigateur ou en application installée.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-foreground">Notre mission</h2>
      <p className="mt-2">
        Donner à chaque étudiant burkinabè les mêmes chances d'accéder à l'information, aux connaissances et aux opportunités, où qu'il se trouve et quelle que soit son université. Aider les établissements à communiquer plus vite et plus clairement avec leurs étudiants, sans outils compliqués ni coûteux.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-foreground">Ce que CampusLink apporte aux étudiants</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-6 marker:text-primary">
        <li><strong>Cours en ligne</strong> : vidéos, PDF et manuscrits classés par filière, niveau et module.</li>
        <li><strong>Bibliothèque</strong> : romans, récits, supports de cours et livres à lire ou à télécharger.</li>
        <li><strong>Révision &amp; IA</strong> : résumés, QCM, fiches et exercices à partir de ses propres cours.</li>
        <li><strong>Opportunités</strong> : stages, emplois, bourses, concours et formations, avec leurs dates limites.</li>
        <li><strong>Guide du nouveau bachelier</strong> : les étapes de l'orientation et de l'inscription expliquées pas à pas.</li>
        <li><strong>Marché étudiant</strong> : acheter, vendre et échanger entre étudiants en toute simplicité.</li>
        <li><strong>Événements sociaux</strong> : l'agenda des concerts, conférences et activités de la vie étudiante.</li>
        <li><strong>Parrainage</strong> : inviter ses camarades et débloquer des avantages en faisant grandir la communauté.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold text-foreground">Ce que CampusLink apporte aux établissements</h2>
      <p className="mt-2">
        Chaque université ou institut partenaire dispose de son propre espace pour publier ses annonces, organiser ses emplois du temps, diffuser ses événements et mettre les résultats à disposition de ses étudiants. Seuls les étudiants pré-inscrits par l'établissement accèdent à cet espace, et les informations d'un établissement ne sont jamais visibles par un autre.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-foreground">Nos principes</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-6 marker:text-primary">
        <li><strong>Simplicité</strong> : un compte se crée en quelques secondes, avec un nom, un numéro de téléphone et un mot de passe.</li>
        <li><strong>Accessibilité</strong> : une application légère, pensée pour les connexions mobiles et installable sur Android, iPhone et ordinateur.</li>
        <li><strong>Respect des données</strong> : pas de revente de données, pas de publicité ciblée, des notes qui restent privées.</li>
        <li><strong>Ancrage local</strong> : des outils construits au Burkina Faso, pour les réalités des campus burkinabè.</li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold text-foreground">Qui est derrière CampusLink</h2>
      <p className="mt-2">
        CampusLink est développé par SAOUADOGO W. E. Epiphane, étudiant en Assurance-Banque-Finance à l'IBAM et développeur indépendant, sous la bannière SWEE Social-Services. Le projet est né de l'envie de construire des outils utiles et adaptés aux réalités locales, avec le souci constant de la simplicité et de la sécurité.
      </p>
      <h2 className="mt-8 text-xl font-semibold text-foreground">Une plateforme en constante évolution</h2>
      <p className="mt-2">
        CampusLink s'améliore en permanence grâce aux retours des étudiants et des établissements. De nouvelles fonctionnalités arrivent régulièrement. Une idée, une suggestion, un problème ? Écrivez-nous : chaque message est lu.
      </p>
      <p className="mt-4">
        Pour toute question :{" "}
        <a
          href="https://wa.me/22657476724"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline"
        >
          WhatsApp : +226 57 47 67 24
        </a>
      </p>

      <div className="mt-10 border-t border-border pt-6 text-center">
        <p className="text-base font-semibold text-foreground">SWEE Social-Services</p>
        <Copyright className="mt-1" />
      </div>
    </PageShell>
  );
}
