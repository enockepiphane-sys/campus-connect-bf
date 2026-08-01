import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/admin-acces")({
  head: () => ({
    meta: [
      { title: "Accès administrateur — CampusLink" },
      {
        name: "description",
        content:
          "Espace réservé aux administrateurs d'établissement CampusLink : inscription et connexion au tableau de bord.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Accès administrateur — CampusLink" },
      {
        property: "og:description",
        content: "Espace réservé aux administrateurs d'établissement CampusLink.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell title="Espace Administrateur">
      <div className="mb-6 flex items-center gap-3 text-muted-foreground">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <p className="text-sm">
          Accès réservé aux administrateurs d'établissement : filières, niveaux et listes
          étudiantes.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link to="/admin/inscription" className="btn-bf-primary">
          <UserPlus className="h-4 w-4" />
          S'inscrire à mon compte administrateur
        </Link>
        <Link to="/admin/connexion" className="btn-bf-outline">
          <LogIn className="h-4 w-4" />
          Se connecter à mon compte administrateur
        </Link>
      </div>
    </PageShell>
  );
}
