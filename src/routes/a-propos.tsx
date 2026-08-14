import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos de CampusLink — Plateforme des campus du Burkina Faso" },
      {
        name: "description",
        content:
          "Découvrez CampusLink : une plateforme unique pour centraliser annonces, emplois du temps et notes des établissements du Burkina Faso.",
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
      <p>
        CampusLink est né d'un constat simple : au Burkina Faso, beaucoup
        d'établissements gèrent encore leurs annonces, emplois du temps et notes
        à la main ou via des outils dispersés — messages WhatsApp, tableaux
        d'affichage, feuilles Excel qui circulent mal.
      </p>
      <p className="mt-4">
        CampusLink centralise tout ça sur une seule plateforme : chaque
        établissement a son espace, chaque étudiant retrouve ses annonces, son
        emploi du temps et ses notes au même endroit, à jour.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">
        Une plateforme, plusieurs établissements
      </h2>
      <p className="mt-2">
        CampusLink est pensé pour accueillir plusieurs universités et instituts,
        chacun avec ses propres filières, niveaux, étudiants et administrateurs —
        sans que les données d'un établissement ne soient jamais visibles par un
        autre.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">
        Qui est derrière CampusLink
      </h2>
      <p className="mt-2">
        CampusLink est développé par SAOUADOGO W. E. Epiphane, étudiant en
        Assurance-Banque-Finance à l'IBAM et développeur indépendant, sous la
        bannière SWEE Social-Services. Le projet est né de l'envie de construire
        des outils utiles et adaptés aux réalités locales — avec le souci
        constant de la simplicité et de la sécurité des données.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">
        Une plateforme en constante évolution
      </h2>
      <p className="mt-2">
        CampusLink continue de s'améliorer avec de nouvelles fonctionnalités
        pensées pour les besoins réels des établissements et des étudiants. Vos
        retours et suggestions sont les bienvenus.
      </p>
      <p className="mt-4">
        Pour toute question :{" "}
        <a
          href="mailto:campuslink226@gmail.com"
          className="font-medium text-primary underline"
        >
          team@campuslink-bf.app
        </a>
      </p>

      <div className="mt-10 border-t border-border pt-6 text-center">
        <p className="text-base font-semibold text-foreground">SWEE Social-Services</p>
        <p className="mt-1 text-xs text-muted-foreground">© SAOUADOGO W. E. Epiphane</p>
      </div>
    </PageShell>
  );
}
