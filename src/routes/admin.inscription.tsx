import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";

type Etab = { id: string; nom: string };

export const Route = createFileRoute("/admin/inscription")({
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [etabId, setEtabId] = useState("");
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "", password: "", password2: "" });
  const [preAuthId, setPreAuthId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("etablissements").select("id,nom").eq("statut", "actif").order("nom")
      .then(({ data }) => setEtabs((data as Etab[]) ?? []));
  }, []);

  async function verifier(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    const { data, error } = await supabase.rpc("verifier_admin_pre_autorise", {
      _etablissement_id: etabId,
      _nom_complet: form.nom_complet,
      _email: form.email,
      _date_naissance: form.date_naissance,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (!data || data.length === 0) { setError("Vous n'êtes pas pré-autorisé comme administrateur pour cet établissement."); return; }
    const row = data[0] as { pre_autorisation_id: string; deja_inscrit: boolean };
    if (row.deja_inscrit) { setError("Cet administrateur est déjà inscrit. Utilisez la page de connexion."); return; }
    setPreAuthId(row.pre_autorisation_id);
    setStep(3);
  }

  async function inscrire(e: React.FormEvent) {
    e.preventDefault(); setError(null); setInfo(null);
    if (form.password.length < 6) { setError("Mot de passe : 6 caractères minimum."); return; }
    if (form.password !== form.password2) { setError("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const emailRedirectTo = `${getSiteUrl()}/admin/connexion`;
    const { data, error: se } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { emailRedirectTo },
    });
    if (se) {
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
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const { error: re } = await supabase.auth.resend({
        type: "signup", email: form.email.trim(),
        options: { emailRedirectTo },
      });
      if (re) { setError(re.message); setBusy(false); return; }
      setInfo("Un compte existe déjà avec cet email mais n'était pas confirmé. Un nouvel email de confirmation vient de vous être envoyé.");
      setBusy(false); return;
    }
    if (data.session && preAuthId) {
      const { error: fe } = await supabase.rpc("finaliser_inscription_admin", { _pre_autorisation_id: preAuthId });
      if (fe) { setError(fe.message); setBusy(false); return; }
      const role = await resolveUserRole();
      navigate({ to: dashboardPathForRole(role) });
      return;
    }
    setInfo("Compte créé. Confirmez votre email puis connectez-vous — votre rôle sera activé automatiquement.");
    setBusy(false);
  }

  return (
    <PageShell title="Inscription administrateur">
      {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>}
      <p className="mb-4 text-sm text-muted-foreground">Étape {step} sur 3</p>

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); if (!etabId) return; setStep(2); }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Sélectionnez votre établissement</label>
            <select required value={etabId} onChange={(e) => setEtabId(e.target.value)}
              className="w-full rounded border border-input bg-surface px-3 py-2">
              <option value="">— Choisir —</option>
              {etabs.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <button className="btn-bf-primary w-full">Continuer</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifier} className="space-y-4">
          <Field label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
          <Field label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
          <Field label="Date de naissance" type="date" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-bf-outline">Retour</button>
            <button disabled={busy} className="btn-bf-primary flex-1">{busy ? "..." : "Vérifier"}</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={inscrire} className="space-y-4">
          <p className="text-sm text-primary">✓ Vérification réussie. Créez votre mot de passe.</p>
          <Field label="Mot de passe" type="password" v={form.password} on={(v) => setForm({ ...form, password: v })} />
          <Field label="Confirmez le mot de passe" type="password" v={form.password2} on={(v) => setForm({ ...form, password2: v })} />
          <button disabled={busy} className="btn-bf-primary w-full">{busy ? "..." : "Créer mon compte"}</button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/admin/connexion" className="text-sm text-primary underline">J'ai déjà un compte administrateur</Link>
      </div>
    </PageShell>
  );
}

function Field({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input required type={type} value={v} onChange={(e) => on(e.target.value)}
        className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
    </div>
  );
}
