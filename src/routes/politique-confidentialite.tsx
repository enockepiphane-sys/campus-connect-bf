import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/politique-confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — CampusLink" },
      {
        name: "description",
        content:
          "Politique de confidentialité de la plateforme CampusLink (Burkina Faso).",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="Politique de confidentialité">
      <p>
        CampusLink est une plateforme dédiée aux universités et étudiants du
        Burkina Faso. Nous prenons la confidentialité de vos données très au
        sérieux.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-white">
        Données collectées
      </h2>
      <p className="mt-2">
        Nous collectons uniquement les informations nécessaires à votre
        inscription (nom, email, date de naissance) et à votre parcours
        académique (établissement, filière, niveau, notes).
      </p>
      <h2 className="mt-6 text-xl font-semibold text-white">
        Utilisation des données
      </h2>
      <p className="mt-2">
        Vos données ne sont jamais revendues à des tiers. Chaque étudiant ne
        peut consulter que ses propres notes ; les annonces, événements et
        emplois du temps sont limités à son niveau et sa filière.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-white">Sécurité</h2>
      <p className="mt-2">
        L'accès aux données est protégé par des règles de sécurité strictes au
        niveau de la base de données. Les administrateurs ne peuvent pas
        consulter les données d'un établissement autre que le leur.
      </p>
    </PageShell>
  );
}
