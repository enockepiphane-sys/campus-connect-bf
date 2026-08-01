import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/admin-acces")({
  head: () => ({
    meta: [
      { title: "Espace Administrateur - CampusLink" },
      {
        name: "description",
        content: "Inscription et connexion pour les administrateurs d'établissement",
      },
    ],
  }),
  component: AdminAccess,
});

function AdminAccess() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <div className="bg-paper min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link to="/" className="btn-bf-outline mb-8">
          Retour à l'accueil
        </Link>
        <div className="kente-stripe mb-8 h-1.5 w-24 rounded-full" />
        <h1 className="mb-8 text-4xl font-bold text-gradient-bf">
          Espace Administrateur
        </h1>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-input">
          <button
            onClick={() => setActiveTab("login")}
            className={`pb-4 font-medium transition ${
              activeTab === "login"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="mb-1 inline-block h-4 w-4" />
            {" "} Se connecter
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`pb-4 font-medium transition ${
              activeTab === "signup"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="mb-1 inline-block h-4 w-4" />
            {" "} S'inscrire
          </button>
        </div>

        {/* Content */}
        <div className="card-glass rounded-2xl p-8">
          {activeTab === "login" && (
            <div className="mx-auto max-w-md">
              <p className="mb-6 text-sm text-muted-foreground">
                Connectez-vous avec vos identifiants d'administrateur.
              </p>
              <Link
                to="/admin/connexion"
                className="btn-bf-primary block w-full text-center"
              >
                Accéder à la connexion
              </Link>
            </div>
          )}

          {activeTab === "signup" && (
            <div className="mx-auto max-w-md">
              <p className="mb-6 text-sm text-muted-foreground">
                Inscrivez-vous en tant qu'administrateur d'établissement.
              </p>
              <Link
                to="/admin/inscription"
                className="btn-bf-primary block w-full text-center"
              >
                Accéder à l'inscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
