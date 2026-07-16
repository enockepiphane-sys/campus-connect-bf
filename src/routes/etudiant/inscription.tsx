import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Building2, Mail, Calendar, Lock, BookOpen } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/etudiant/inscription")({
  head: () => ({ meta: [{ title: "Inscription Étudiant — CampusLink" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [etablissements, setEtablissements] = useState<{ id: string; nom: string }[]>([]);
  const [etabId, setEtabId] = useState("");
  const [nomComplet, setNomComplet] = useState("");
  const [email, setEmail] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadEtablissements() {
    if (loaded) return;
    const { data } = await supabase.from("etablissements").select("id, nom").eq("statut", "actif").order("nom");
    if (data) setEtablissements(data);
    setLoaded(true);
  }
  loadEtablissements();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { data: etudiant, error: etuErr } = await supabase
      .from("etudiants_pre_inscrits")
      .select("id")
      .eq("etablissement_id", etabId)
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (etuErr || !etudiant) {
      setError("Vous n'êtes pas pré-inscrit. Contactez votre établissement.");
      setBusy(false);
      return;
    }

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setBusy(false);
      return;
    }

    if (authData.user) {
      await supabase.from("etudiants_pre_inscrits").update({ user_id: authData.user.id, inscrit: true }).eq("id", etudiant.id);
      await supabase.from("user_roles").insert({ user_id: authData.user.id, role: "etudiant", etablissement_id: etabId });
    }

    navigate({ to: "/etudiant/connexion" });
  }

  return (
    <PageShell title="Inscription Étudiant">
      <div className="card-glass mx-auto max-w-md rounded-2xl p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80"><Building2 className="h-4 w-4" /> Établissement</label>
            <select value={etabId} onChange={(e) => setEtabId(e.target.value)} required className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary">
              <option value="">Sélectionner...</option>
              {etablissements.map((e) => (<option key={e.id} value={e.id}>{e.nom}</option>))}
            </select>
          </div>
          <FormField icon={<UserPlus className="h-4 w-4" />} label="Nom complet" value={nomComplet} onChange={setNomComplet} required />
          <FormField icon={<Mail className="h-4 w-4" />} label="Email" type="email" value={email} onChange={setEmail} required />
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80"><Calendar className="h-4 w-4" /> Date de naissance</label>
            <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} required className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80"><Lock className="h-4 w-4" /> Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
          </div>
          <button type="submit" disabled={busy} className="btn-bf-primary w-full disabled:opacity-60">{busy ? "..." : "S'inscrire"}</button>
        </form>
      </div>
    </PageShell>
  );
}

function FormField({ icon, label, value, onChange, type = "text", required }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">{icon} {label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-lg border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
    </div>
  );
}
