import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EspacesShell } from "@/components/EspacesShell";
import { connecterMembre, retourSur } from "@/lib/membres";

export const Route = createFileRoute("/connexion")({
  validateSearch: (s: Record<string, unknown>) => ({ retour: retourSur(s.retour) }),
  head: () => ({
    meta: [
      { title: "Connexion — CampusLink" },
      { name: "description", content: "Connecte-toi avec ton numéro de téléphone pour retrouver la bibliothèque, le marché étudiant et les opportunités." },
      { property: "og:title", content: "Connexion — CampusLink" },
      { property: "og:description", content: "Retrouve ton compte CampusLink avec ton numéro de téléphone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const { retour } = Route.useSearch();
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <EspacesShell title="Connexion">
      <form
        className="mx-auto my-8 max-w-md space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErreur("");
          try {
            await connecterMembre(telephone, motDePasse);
            window.location.assign(retour);
          } catch (err) {
            setErreur(err instanceof Error ? err.message : "Connexion impossible.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="c-tel">Numéro de téléphone</Label>
          <Input id="c-tel" type="tel" inputMode="tel" autoComplete="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-mdp">Mot de passe</Label>
          <Input id="c-mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </div>
        {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
        <Button type="submit" disabled={busy} className="w-full"><LogIn />{busy ? "Connexion…" : "Se connecter"}</Button>
        <p className="text-center text-sm">
          Pas encore de compte ? <Link to="/inscription" search={{ retour }} className="text-primary underline">Créer mon compte</Link>
        </p>
      </form>
    </EspacesShell>
  );
}
