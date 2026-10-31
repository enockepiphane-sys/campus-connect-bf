import { createFileRoute } from "@tanstack/react-router";
import { EspacesShell } from "@/components/EspacesShell";
import { BibliothequeList } from "@/components/BibliothequeList";

export const Route = createFileRoute("/_commun/bibliotheque")({
  head: () => ({
    meta: [
      { title: "Bibliothèque — CampusLink" },
      { name: "description", content: "Romans, récits, supports de cours et livres à lire ou à télécharger gratuitement sur CampusLink." },
      { property: "og:title", content: "Bibliothèque — CampusLink" },
      { property: "og:description", content: "Romans, récits, supports de cours et livres à lire ou à télécharger gratuitement." },
    ],
  }),
  component: () => (
    <EspacesShell title="Bibliothèque">
      <BibliothequeList />
    </EspacesShell>
  ),
});
