import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { GuideList } from "@/components/GuideList";

export const Route = createFileRoute("/_commun/guide-bachelier")({
  head: () => ({
    meta: [
      { title: "Guide du nouveau bachelier — CampusLink" },
      { name: "description", content: "Campus Faso expliqué simplement : créer son compte, faire son orientation, s'inscrire et suivre ses résultats." },
      { property: "og:title", content: "Guide du nouveau bachelier — CampusLink" },
      { property: "og:description", content: "Créer son compte Campus Faso, choisir ses vœux, s'inscrire : toutes les étapes expliquées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <EspacesShell title="Guide du nouveau bachelier">
      <GuideList />
    </EspacesShell>
  ),
});
