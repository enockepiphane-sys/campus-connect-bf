import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { getSiteUrl } from "@/lib/site-url";
import { humanizeAuthError } from "@/lib/auth-timeout";
import { ResendConfirmationEmail } from "@/components/ResendConfirmationEmail";

type Etab = { id: string; nom: string };
type Filiere = { id: string; nom: string };
type Niveau = { id: string; nom: string; ordre: number };

export const Route = createFileRoute("/etudiant/inscription")({
  component: Page,
});

function Page() {
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [etabId, setEtabId] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [existantNonConfirme, setExistantNonConfirme] = useState(false);


  useEffect(() => {
    supabase.from("etablissements").select("id,nom").eq("statut", "actif").order("nom")
      .then(({ data }) => setEtabs((data as Etab[]) ?? []));
  }, []);
  useEffect(() => {
    if (!etabId) { setFilieres([]); return; }
    supabase.from("filieres").select("id,nom").eq("etablissement_id", etabId).order("nom")
      .then(({ data }) => setFilieres((data as Filiere[]) ?? []));
  }, [etabId]);
  useEffect(() => {
    if (!filiereId) { setNiveaux([]); return; }
    supabase.from("niveaux").select("id,nom,ordre").eq("filiere_id", filiereId).order("ordre")
      .then(({ data }) => setNiveaux((data as Niveau[]) ?? []));
  }, [filiereId]);

  async function verifier(e: React.FormEvent) {
    e.preventDefault(); setError(null); setInfo(null); setBusy(true);
    const { data, error } = await supabase.rpc("verifier_etudiant_pre_inscrit", {
      _etablissement_id: etabId, _filiere_id: filiereId, _niveau_id: niveauId,
      _nom_complet: form.nom_complet, _email: form.email, _date_naissance: form.date_naissance,
    });
    if (error) { setError(humanizeAuthError(error)); setBusy(false); return; }
    if (!data || data.length === 0) { setError("Vous n'êtes pas pré-inscrit pour ce niveau. Contactez votre administration."); setBusy(false); return; }
    const row = data[0] as { pre_inscription_id: string; deja_inscrit: boolean };
    if (row.deja_inscrit) { setError("Cet étudiant est déjà inscrit. Utilisez la page de connexion."); setBusy(false); return; }

    // Aucun mot de passe n'est demandé ici : on en génère un aléatoire,
    // connu de personne. Le vrai mot de passe ne sera défini qu'après le
    // clic sur le lien de confirmation reçu par email, ce qui garantit que
    // seul le titulaire de la boîte mail peut activer le compte.
    // Génère un mot de passe aléatoire garanti conforme aux règles
    // Supabase (minuscule + majuscule + chiffre), en insérant explicitement
    // un caractère de chaque catégorie plutôt que de compter sur le hasard.
    const motDePasseAleatoire =
      "Aa1" + crypto.randomUUID().replace(/-/g, "");
    const emailRedirectTo = `${getSiteUrl()}/etudiant/connexion`;
    const { data: suData, error: se } = await supabase.auth.signUp({
      email: form.email.trim(), password: motDePasseAleatoire,
      options: { emailRedirectTo, data: { pre_inscription_id: row.pre_inscription_id } },
    });
    const existant =
      (se && /already registered|already been registered|User already/i.test(se.message)) ||
      (!se && suData.user && Array.isArray(suData.user.identities) && suData.user.identities.length === 0);

    if (existant) {
      setInfo(
        "Un compte existe déjà avec cet email mais n'a pas pu être confirmé. " +
        "Rendez-vous sur « Mot de passe oublié » pour réinitialiser votre mot de passe : cela confirmera votre compte et vous donnera accès à votre espace."
      );
      setExistantNonConfirme(true);
      setBusy(false); return;
    }
    if (se) { setError(humanizeAuthError(se)); setBusy(false); return; }
    if (suData.session) {
      await supabase.auth.signOut();
    }
    setInfo("Vérifiez votre boîte mail : cliquez sur le lien de confirmation pour définir votre mot de passe et activer votre compte.");
    setStep(4);
    setBusy(false);
  }

  return (
    <PageShell title="Inscription étudiant">
      {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>}
      {existantNonConfirme && (
        <Link to="/etudiant/mot-de-passe-oublie" className="btn-bf-primary mb-4 inline-block text-center">
          Réinitialiser mon mot de passe
        </Link>
      )}
      {showResend && (
        <ResendConfirmationEmail
          email={form.email}
          emailRedirectTo={`${getSiteUrl()}/etudiant/connexion`}
          startCooledDown
        />
      )}
      <p className="mb-4 mt-4 text-sm text-muted-foreground">Étape {step} sur 4</p>


      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); if (etabId) setStep(2); }} className="space-y-4">
          <Select label="Établissement" v={etabId} on={setEtabId} options={etabs} />
          <button className="btn-bf-primary w-full">Continuer</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); if (filiereId) setStep(3); }} className="space-y-4">
          {filieres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune filière disponible pour cet établissement. Contactez votre administration.</p>
          ) : <Select label="Filière" v={filiereId} on={setFiliereId} options={filieres} />}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-bf-outline">Retour</button>
            <button className="btn-bf-primary flex-1" disabled={!filiereId}>Continuer</button>
          </div>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); if (niveauId) setStep(4); }} className="space-y-4">
          {niveaux.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun niveau disponible pour cette filière.</p>
          ) : <Select label="Niveau" v={niveauId} on={setNiveauId} options={niveaux} />}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn-bf-outline">Retour</button>
            <button className="btn-bf-primary flex-1" disabled={!niveauId}>Continuer</button>
          </div>
        </form>
      )}
      {step === 4 && !info && (
        <form onSubmit={verifier} className="space-y-4">
          <F label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
          <F label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
          <F label="Date de naissance" type="date" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(3)} className="btn-bf-outline">Retour</button>
            <button disabled={busy} className="btn-bf-primary flex-1">{busy ? "..." : "Créer mon compte"}</button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/etudiant/connexion" className="text-sm text-primary underline">J'ai déjà un compte étudiant</Link>
      </div>
    </PageShell>
  );
}

function Select({ label, v, on, options }: { label: string; v: string; on: (v: string) => void; options: { id: string; nom: string }[] }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <select required value={v} onChange={(e) => on(e.target.value)}
        className="w-full rounded border border-input bg-surface px-3 py-2">
        <option value="">— Choisir —</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
      </select>
    </div>
  );
}
function F({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input required type={type} value={v} onChange={(e) => on(e.target.value)}
        className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
    </div>
  );
}
