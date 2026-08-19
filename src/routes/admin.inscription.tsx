import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { getSiteUrl } from "@/lib/site-url";
import { humanizeAuthError } from "@/lib/auth-timeout";
import { ResendConfirmationEmail } from "@/components/ResendConfirmationEmail";

type Etab = { id: string; nom: string };

export const Route = createFileRoute("/admin/inscription")({
  component: Page,
});

function Page() {
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [etabId, setEtabId] = useState("");
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

  async function verifier(e: React.FormEvent) {
    e.preventDefault(); setError(null); setInfo(null); setBusy(true);
    const { data, error } = await supabase.rpc("verifier_admin_pre_autorise", {
      _etablissement_id: etabId,
      _nom_complet: form.nom_complet,
      _email: form.email,
      _date_naissance: form.date_naissance,
    });
    if (error) { setError(humanizeAuthError(error)); setBusy(false); return; }
    if (!data || data.length === 0) { setError("Vous n'êtes pas pré-autorisé comme administrateur pour cet établissement."); setBusy(false); return; }
    const row = data[0] as { deja_inscrit: boolean };
    if (row.deja_inscrit) { setError("Cet administrateur est déjà inscrit. Utilisez la page de connexion."); setBusy(false); return; }

    // Aucun mot de passe n'est demandé ici : on en génère un aléatoire,
    // connu de personne. Le vrai mot de passe ne sera défini qu'après le
    // clic sur le lien de confirmation reçu par email, ce qui garantit que
    // seul le titulaire de la boîte mail peut activer le compte.
    // Génère un mot de passe aléatoire garanti conforme aux règles
    // Supabase (minuscule + majuscule + chiffre), en insérant explicitement
    // un caractère de chaque catégorie plutôt que de compter sur le hasard.
    const motDePasseAleatoire =
      "Aa1" + crypto.randomUUID().replace(/-/g, "");
    const emailRedirectTo = `${getSiteUrl()}/admin/connexion`;
    const { data: suData, error: se } = await supabase.auth.signUp({
      email: form.email.trim(), password: motDePasseAleatoire,
      options: { emailRedirectTo },
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
    setBusy(false);
  }

  return (
    <PageShell title="Inscription administrateur">
      {error && <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>}
      {existantNonConfirme && (
        <Link to="/admin/mot-de-passe-oublie" className="btn-bf-primary mb-4 inline-block text-center">
          Réinitialiser mon mot de passe
        </Link>
      )}
      {showResend && (
        <ResendConfirmationEmail
          email={form.email}
          emailRedirectTo={`${getSiteUrl()}/admin/connexion`}
          startCooledDown
        />
      )}
      <p className="mb-4 mt-4 text-sm text-muted-foreground">Étape {step} sur 3</p>


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

      {step === 2 && !info && (
        <form onSubmit={verifier} className="space-y-4">
          <Field label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
          <Field label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
          <Field label="Date de naissance" type="date" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-bf-outline">Retour</button>
            <button disabled={busy} className="btn-bf-primary flex-1">{busy ? "..." : "Créer mon compte"}</button>
          </div>
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
