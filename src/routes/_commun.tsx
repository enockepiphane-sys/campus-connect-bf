import { createFileRoute, Outlet } from "@tanstack/react-router";
// Révision & IA et Opportunités sont ouvertes à tous les visiteurs : aucune connexion,
// aucun établissement ni pré-inscription n'est requis. Seule la page de gestion des
// offres (_commun.gestion-opportunites) vérifie elle-même la connexion.
export const Route = createFileRoute("/_commun")({
  ssr: false,
  component: () => <Outlet />,
});
