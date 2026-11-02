import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageAuth } from "@/components/PageAuth";
import { connecterMembre, EMAIL_REFUSE, inscrireMembreDirect, retourSur, validerInscription } from "@/lib/membres";
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
      // 1) Inscription directe : le compte est créé dans le MÊME projet Supabase que celui de la connexion.
      try {
        await inscrireMembreDirect(nom, telephone, motDePasse);
        window.location.assign(retour);
        return;
      } catch (e) {
        if (!(e instanceof Error) || e.message !== EMAIL_REFUSE) throw e;
      }
      // 2) Secours (adresse technique refusée par Supabase) : création côté serveur.
      const res = (await inscrireMembre({ data: { nom, telephone, motDePasse } } as never)) as
        | { ok: true }
        | { ok: false; message: string; secours: boolean };
      if (!res || !res.ok) throw new Error(res && !res.ok ? res.message : "Inscription impossible pour le moment.");
      await connecterMembre(telephone, motDePasse);
      window.location.assign(retour);
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
