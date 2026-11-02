import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, Sparkles, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Carte d'accueil de l'inscription PRIMAIRE (séparée de l'Espace Étudiant).
export function CompteMembreCarte() {
  const [etat, setEtat] = useState<"inconnu" | "connecte" | "visiteur">("inconnu");
  const [nom, setNom] = useState("");

  useEffect(() => {
    const maj = (meta: Record<string, unknown> | undefined, ok: boolean) => {
      setEtat(ok ? "connecte" : "visiteur");
      setNom(typeof meta?.nom_profil === "string" ? meta.nom_profil : "");
    };
    void supabase.auth.getSession().then(({ data }) => maj(data.session?.user.user_metadata, Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => maj(s?.user.user_metadata, Boolean(s)));
    return () => data.subscription.unsubscribe();
  }, []);

  if (etat === "inconnu") return null;
  if (etat === "connecte") {
    return (
      <p className="flex items-center justify-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-center text-sm font-semibold text-primary">
        <Sparkles className="h-4 w-4" />Bienvenue{nom ? ` ${nom}` : ""} ! Toutes les fonctionnalités ci-dessous te sont ouvertes.
      </p>
    );
  }
  return (
    <section className="card-glass rounded-2xl p-6">
      <h2 className="font-display text-xl font-bold">Mon compte CampusLink</h2>
      <p className="mt-1 text-sm text-muted-foreground">Inscription unique et gratuite (nom, téléphone, mot de passe) pour accéder au Marché, à la Bibliothèque, aux Opportunités…</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link to="/inscription" search={{ retour: "/" }} className="btn-bf-primary flex-1"><UserPlus className="h-4 w-4" />Créer mon compte</Link>
        <Link to="/connexion" search={{ retour: "/" }} className="btn-bf-outline flex-1"><LogIn className="h-4 w-4" />J’ai déjà un compte</Link>
      </div>
    </section>
  );
}
