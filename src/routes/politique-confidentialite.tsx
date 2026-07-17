import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/politique-confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — CampusLink" }] }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="Politique de confidentialité">
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground">Collecte des données</h2>
        <p className="mt-2">CampusLink collecte les informations nécessaires au fonctionnement du service : nom, email, date de naissance pour les étudiants ; nom, email pour les administrateurs. Ces données sont fournies volontairement par les utilisateurs lors de l'inscription.</p>
        <h2 className="mt-6 text-xl font-semibold text-foreground">Utilisation des données</h2>
        <p className="mt-2">Les données collectées servent uniquement à l'identification des utilisateurs, à l'affichage des notes, annonces, emplois du temps et événements. Aucune donnée n'est revendue ou partagée avec des tiers.</p>
        <h2 className="mt-6 text-xl font-semibold text-foreground">Sécurité</h2>
        <p className="mt-2">L'accès aux données est protégé par des règles de sécurité strictes au niveau de la base de données. Les administrateurs ne peuvent pas consulter les données d'un établissement autre que le leur.</p>
      </div>
      <div className="mt-10 border-t border-border pt-6 text-center">
        <p className="text-base font-semibold text-foreground">SWE Social Service</p>
        <p className="mt-1 text-xs text-muted-foreground">© W.E. Epiphane Saouadogo</p>
      </div>
    </PageShell>
  );
}
