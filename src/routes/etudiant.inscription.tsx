import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";

type Etab = { id: string; nom: string };
type Filiere = { id: string; nom: string };
type Niveau = { id: string; nom: string; ordre: number };

export const Route = createFileRoute("/etudiant/inscription")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [etabId, setEtabId] = useState("");
  const [filiereId, setFiliereId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "", password: "", password2: "" });
  const [preId, setPreId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    e.preventDefault(); setError(null); setBusy(true);
    const { data, error } = await supabase.rpc("verifier_etudiant_pre_inscrit", {
      _etablissement_id: etabId, _filiere_id: filiereId, _niveau_id: niveauId,
      _nom_complet: form.nom_complet, _email: form.email, _date_naissance: form.date_naissance,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (!data || data.length === 0) { setError("Vous n'êtes pas pré-inscrit pour ce niveau. Contactez votre administration."); return; }
    const row = data[0] as { pre_inscription_id: string; deja_inscrit: boolean };
    if (row.deja_inscrit) { setError("Cet étudiant est déjà inscrit. Utilisez la page de connexion."); return; }
    setPreId(row.pre_inscription_id);
    setStep(5);
  }

  async function inscrire(e: React.FormEvent) {
    e.preventDefault(); setError(null); setInfo(null);
    if (form.password.length < 6) { setError("Mot de passe : 6 caractères min."); return; }
    if (form.password !== form.password2) { setError("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const emailRedirectTo = `${getSiteUrl()}/etudiant/connexion`;
    const { data, error: se } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { emailRedirectTo },
    });
    if (se) {
      // Compte existant : tenter le renvoi de l'email de confirmation
      if (/already registered|already been registered|User already/i.test(se.message)) {
        const { error: re } = await supabase.auth.resend({
          type: "signup", email: form.email.trim(),
          options: { emailRedirectTo },
        });
        if (re) { setError(re.message); setBusy(false); return; }
        setInfo("Un compte existe déjà avec cet email. Nous vous avons renvoyé un nouvel email de confirmation.");
        setBusy(false); return;
      }
      setError(se.message); setBusy(false); return;
    }
    // Utilisateur existant non confirmé : identities vide → renvoyer l'email
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const { error: re } = await supabase.auth.resend({
        type: "signup", email: form.email.trim(),
        options: { emailRedirectTo },
      });
      if (re) { setError(re.message); setBusy(false); return; }
      setInfo("Un compte existe déjà avec cet email mais n'était pas confirmé. Un nouvel email de confirmation vient de vous être envoyé.");
      setBusy(false); return;
    }
    if (data.session && preId) {
      const { error: fe } = await supabase.rpc("finaliser_inscription_etudiant", { _pre_inscription_id: preId });
      if (fe) { setError(fe.message); setBusy(false); return; }
      const role = await resolveUserRole();
      navigate({ to: dashboardPathForRole(role) });
      return;
    }
    setInfo("Compte créé. Confirmez votre email puis connectez-vous.");
    setBusy(false);
  }

  return (
    <PageShell title="Inscription étudiant">
      {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>}
      <p className="mb-4 text-sm text-muted-foreground">Étape {step} sur 5</p>

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
      {step === 4 && (
        <form onSubmit={verifier} className="space-y-4">
          <F label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
          <F label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
          <F label="Date de naissance" type="date" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(3)} className="btn-bf-outline">Retour</button>
            <button disabled={busy} className="btn-bf-primary flex-1">{busy ? "..." : "Vérifier"}</button>
          </div>
        </form>
      )}
      {step === 5 && (
        <form onSubmit={inscrire} className="space-y-4">
          <p className="text-sm text-primary">✓ Vérification réussie. Créez votre mot de passe.</p>
          <F label="Mot de passe" type="password" v={form.password} on={(v) => setForm({ ...form, password: v })} />
          <F label="Confirmez le mot de passe" type="password" v={form.password2} on={(v) => setForm({ ...form, password2: v })} />
          <button disabled={busy} className="btn-bf-primary w-full">{busy ? "..." : "Créer mon compte"}</button>
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
