import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageAuth } from "@/components/PageAuth";
import { connecterMembre, REGLE_MOT_DE_PASSE, retourSur, validerMotDePasse } from "@/lib/membres";
import { demanderCodeReinit, reinitialiserMotDePasse } from "@/lib/membres.functions";

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

type Res = { ok: boolean; message?: string };

function Connexion() {
  const { retour } = Route.useSearch();
  // « connexion » = normal ; « oubli » = demander un code ; « code » = saisir le code + nouveau mot de passe
  const [etape, setEtape] = useState<"connexion" | "oubli" | "code">("connexion");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function seConnecter(e: React.FormEvent) {
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
  }

  async function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur("");
    setInfo("");
    try {
      const res = (await demanderCodeReinit({ data: { telephone } } as never)) as Res;
      if (!res?.ok) throw new Error(res?.message || "Service indisponible pour le moment.");
      setInfo(res.message ?? "Code envoyé.");
      setEtape("code");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Service indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    const probleme = validerMotDePasse(motDePasse);
    if (probleme) return setErreur(probleme);
    setBusy(true);
    setErreur("");
    try {
      const res = (await reinitialiserMotDePasse({ data: { telephone, code, motDePasse } } as never)) as Res;
      if (!res?.ok) throw new Error(res?.message || "Service indisponible pour le moment.");
      await connecterMembre(telephone, motDePasse);
      window.location.assign(retour);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Service indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  }

  const champTel = (
    <div className="space-y-2">
      <Label htmlFor="c-tel">Numéro de téléphone</Label>
      <Input id="c-tel" type="tel" inputMode="tel" autoComplete="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} />
    </div>
  );
  const messages = (
    <>
      {info && <p className="text-sm text-muted-foreground">{info}</p>}
      {erreur && <p role="alert" className="text-sm text-destructive">{erreur}</p>}
    </>
  );

  if (etape === "oubli") {
    return (
      <PageAuth titre="Mot de passe oublié" sousTitre="Un code sera envoyé à ton email de récupération.">
        <form className="space-y-5" onSubmit={envoyerCode}>
          {champTel}
          {messages}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Envoi…" : "Recevoir un code"}</Button>
          <p className="text-center text-sm">
            <button type="button" className="text-primary underline" onClick={() => { setEtape("connexion"); setErreur(""); setInfo(""); }}>Retour à la connexion</button>
          </p>
        </form>
      </PageAuth>
    );
  }

  if (etape === "code") {
    return (
      <PageAuth titre="Nouveau mot de passe" sousTitre="Entre le code reçu par email et choisis un nouveau mot de passe.">
        <form className="space-y-5" onSubmit={changerMotDePasse}>
          {messages}
          <div className="space-y-2">
            <Label htmlFor="c-code">Code à 6 chiffres</Label>
            <Input id="c-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-nmdp">Nouveau mot de passe</Label>
            <Input id="c-nmdp" type="password" autoComplete="new-password" required minLength={6} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            <p className="text-xs text-muted-foreground">{REGLE_MOT_DE_PASSE}</p>
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Enregistrement…" : "Changer mon mot de passe"}</Button>
          <p className="text-center text-sm">
            <button type="button" className="text-primary underline" onClick={() => { setEtape("oubli"); setErreur(""); setInfo(""); }}>Redemander un code</button>
          </p>
        </form>
      </PageAuth>
    );
  }

  return (
    <PageAuth titre="Connexion" sousTitre="Content de te revoir ! Entre ton numéro et ton mot de passe.">
      <form className="space-y-5" onSubmit={seConnecter}>
        {champTel}
        <div className="space-y-2">
          <Label htmlFor="c-mdp">Mot de passe</Label>
          <Input id="c-mdp" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </div>
        {messages}
        <Button type="submit" disabled={busy} className="w-full"><LogIn />{busy ? "Connexion…" : "Se connecter"}</Button>
        <p className="text-center text-sm">
          <button type="button" className="text-primary underline" onClick={() => { setEtape("oubli"); setErreur(""); setMotDePasse(""); }}>Mot de passe oublié ?</button>
        </p>
        <p className="text-center text-sm">
          Pas encore de compte ? <Link to="/inscription" search={{ retour }} className="text-primary underline">Créer mon compte</Link>
        </p>
      </form>
    </PageAuth>
  );
}
