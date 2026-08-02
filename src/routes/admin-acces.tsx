import { createFileRoute } from "@tanstack/react-router";
import { AdminConnexionPage } from "@/routes/admin.connexion";

export const Route = createFileRoute("/admin-acces")({
  head: () => ({
    meta: [
      { title: "Accès administrateur — CampusLink" },
      {
        name: "description",
        content:
          "Espace réservé aux administrateurs d'établissement partenaires de CampusLink.",
      },
      { property: "og:title", content: "Accès administrateur — CampusLink" },
      {
        property: "og:description",
        content:
          "Connexion à l'espace administrateur d'établissement de CampusLink.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminConnexionPage,
});
