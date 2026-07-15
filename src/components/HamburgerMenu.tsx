import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/fonctionnalites", label: "Fonctionnalités" },
  { to: "/cours-en-ligne", label: "Cours en ligne" },
  { to: "/devenir-partenaire", label: "Devenir partenaire" },
  { to: "/politique-confidentialite", label: "Politique de confidentialité" },
] as const;

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-primary shadow-sm transition hover:bg-primary-soft"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <button
            aria-label="Fermer"
            onClick={() => { setOpen(false); setShowSuperAdmin(false); }}
            className="flex-1 bg-foreground/40 backdrop-blur-sm"
          />
          <nav className="flex w-80 max-w-full flex-col border-l border-border bg-surface p-6 shadow-2xl">
            <div className="kente-stripe mb-6 h-1.5 w-20 rounded-full" />
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => { setOpen(false); setShowSuperAdmin(false); }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 text-foreground/80 transition hover:bg-primary-soft hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Point d'accès discret super admin */}
            <div className="mt-auto pt-8">
              <button
                type="button"
                aria-label="Accès réservé"
                onClick={() => setShowSuperAdmin(true)}
                className="mx-auto block h-2 w-2 rounded-full bg-muted-foreground/30 transition hover:bg-primary"
                title=""
              />
            </div>
          </nav>
        </div>
      )}

      {showSuperAdmin && open && (
        <SuperAdminModal onClose={() => { setShowSuperAdmin(false); setOpen(false); }} />
      )}
    </>
  );
}

function SuperAdminModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="kente-stripe mb-4 h-1.5 w-16 rounded-full" />
        <h3 className="mb-4 text-lg font-semibold text-foreground">Espace Super Administrateur</h3>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-1">
          <button
            onClick={() => setTab("login")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${tab === "login" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"}`}
          >
            Se connecter
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${tab === "signup" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"}`}
          >
            S'inscrire
          </button>
        </div>

        {tab === "login" ? <LoginForm /> : <SignupFlow />}

        <button onClick={onClose} className="mt-4 w-full text-center text-xs text-muted-foreground underline">
          Fermer
        </button>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    const { data: signInData, error: le } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (le) { setError("Identifiants incorrects"); setBusy(false); return; }
    const token = signInData.session?.access_token;
    if (!token) { setError("Session invalide."); setBusy(false); return; }
    const res = await fetch("/api/super-admin/ensure-role", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token }),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (!json.ok) {
      await supabase.auth.signOut();
      setError("Accès non autorisé");
      setBusy(false);
      return;
    }
    navigate({ to: "/super-admin" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <Field label="Email" type="email" value={email} onChange={setEmail} />
      <Field label="Mot de passe" type="password" value={password} onChange={setPassword} />
      <button type="submit" disabled={busy} className="btn-bf-primary w-full disabled:opacity-60">
        {busy ? "..." : "Se connecter"}
      </button>
    </form>
  );
}

function SignupFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "", password: "", password2: "" });
  const [preId, setPreId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verifier(e: React.FormEvent) {
    e.preventDefault(); setError(null); setBusy(true);
    const { data, error } = await supabase.rpc("verifier_super_admin_pre_autorise", {
      _nom_complet: form.nom_complet,
      _email: form.email,
      _date_naissance: form.date_naissance,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (!data || (data as unknown[]).length === 0) {
      setError("Aucun super administrateur pré-autorisé ne correspond à ces informations.");
      return;
    }
    const row = (data as { super_admin_id: string; deja_inscrit: boolean }[])[0];
    if (row.deja_inscrit) {
      setError("Ce super administrateur est déjà inscrit. Utilisez l'onglet Se connecter.");
      return;
    }
    setPreId(row.super_admin_id);
    setStep(2);
  }

  async function inscrire(e: React.FormEvent) {
    e.preventDefault(); setError(null); setInfo(null);
    if (form.password.length < 6) { setError("Mot de passe : 6 caractères min."); return; }
    if (form.password !== form.password2) { setError("Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    const { data, error: se } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (se) { setError(se.message); setBusy(false); return; }
    if (data.session && preId) {
      const { error: fe } = await supabase.rpc("finaliser_inscription_super_admin", { _super_admin_id: preId });
      if (fe) { setError(fe.message); setBusy(false); return; }
      navigate({ to: "/super-admin" });
      return;
    }
    setInfo("Compte créé. Confirmez votre email puis reconnectez-vous via l'onglet Se connecter.");
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {info && <div className="rounded-lg border border-primary/30 bg-primary-soft p-3 text-sm text-primary">{info}</div>}
      <p className="text-xs text-muted-foreground">Étape {step} sur 2</p>

      {step === 1 && (
        <form onSubmit={verifier} className="space-y-3">
          <Field label="Nom complet" value={form.nom_complet} onChange={(v) => setForm({ ...form, nom_complet: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Date de naissance" type="date" value={form.date_naissance} onChange={(v) => setForm({ ...form, date_naissance: v })} />
          <button type="submit" disabled={busy} className="btn-bf-primary w-full disabled:opacity-60">
            {busy ? "..." : "Vérifier"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={inscrire} className="space-y-3">
          <p className="text-sm text-primary">✓ Vérification réussie. Créez votre mot de passe.</p>
          <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
          <Field label="Confirmer le mot de passe" type="password" value={form.password2} onChange={(v) => setForm({ ...form, password2: v })} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-bf-outline">Retour</button>
            <button type="submit" disabled={busy} className="btn-bf-primary flex-1 disabled:opacity-60">
              {busy ? "..." : "Créer mon compte"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-foreground/80">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary"
      />
    </div>
  );
}
