import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageAuth } from "@/components/PageAuth";
import { connecterMembre, inscrireMembreDirect, retourSur, validerInscription } from "@/lib/membres";
import { inscrireMembre } from "@/lib/membres.functions";

export const Route = createFileRoute("/inscription")({
  validateSearch: (s: Record<string, unknown>) => ({ retour: retourSur(s.retour) }),
  head: () => ({
    meta: [
      { title: "Créer mon compte CampusLink" },
      { name: "description", content: "Inscription gratuite en 30 secondes : nom, téléphone et mot de passe pour accéder à la bibliothèque, au marché étudiant et aux opportunités." },
      { property: "og:title", content: "Créer mon compte CampusLink" },
      { property: "og:description", content: "Un seul compte pour la bibliothèque, le marché étudiant et les opportunités." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inscription,
});

function Inscription() {
  const { retour } = Route.useSearch();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const probleme = validerInscription(nom, telephone, motDePasse);
    if (probleme) return setErreur(probleme);
    setBusy(true);
    setErreur("");
    try {
      // 1) Voie normale : création du compte côté serveur.
      let secours = false;
      let cree = false;
      try {
        const res = (await inscrireMembre({ data: { nom, telephone, motDePasse } } as never)) as
          | { ok: true }
          | { ok: false; message: string; secours: boolean };
        if (res && res.ok) cree = true;
        else if (res && !res.ok && !res.secours) throw new Error(res.message);
        else secours = true;
      } catch (e) {
        // Refus normal (numéro déjà inscrit…) : on l'affiche. Panne technique : on tente la voie de secours.
        if (e instanceof Error && /déjà inscrit|invalide|caractères|refusé/i.test(e.message)) throw e;
        secours = true;
      }
      if (cree) {
        await connecterMembre(telephone, motDePasse);
        window.location.assign(retour);
        return;
      }
      // 2) Voie de secours : inscription directe depuis le navigateur.
      if (secours) {
        await inscrireMembreDirect(nom, telephone, motDePasse);
        window.location.assign(retour);
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageAuth titre="Créer mon compte" sousTitre="Inscription unique et gratuite, en 30 secondes.">
      <form className="space-y-5" onSubmit={envoyer}>
        <p className="text-sm text-muted-foreground">
          Inscription unique et gratuite. Ensuite, CampusLink s’ouvre directement sur ton téléphone, sans retaper ton mot de passe.
        </p>
        <div className="space-y-2">
          <Label htmlFor="m-nom">Nom de profil</Label>
          <Input id="m-nom" autoComplete="nickname" required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Awa K." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-tel">Numéro de téléphone</Label>
          <Input id="m-tel" type="tel" inputMode="tel" autoComplete="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="70 00 00 00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-mdp">Mot de passe</Label>
          <Input id="m-mdp" type="password" autoComplete="new-password" required minLength={6} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </div>
        {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
        <Button type="submit" disabled={busy} className="w-full"><UserPlus />{busy ? "Création…" : "Créer mon compte"}</Button>
        <p className="text-center text-sm">
          Déjà inscrit ? <Link to="/connexion" search={{ retour }} className="text-primary underline">Se connecter</Link>
        </p>
        <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          Ce compte est différent de l’Espace Étudiant (notes, emploi du temps), réservé aux étudiants pré-inscrits par leur établissement partenaire.
        </p>
      </form>
    </PageAuth>
  );
}
