import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";
import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, Building2, UserPlus, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin")({
  component: Dashboard,
});

type Etab = { id: string; nom: string; email: string | null; telephone: string | null; adresse: string | null; description: string | null; statut: string };
type PreAdmin = { id: string; nom_complet: string; email: string; date_naissance: string; inscrit: boolean; etablissement_id: string };
type Demande = { id: string; nom_etablissement: string; nom_contact: string; email_contact: string; telephone_contact: string | null; message: string | null; statut: string; created_at: string };

function Dashboard() {
  const [tab, setTab] = useState<"etabs" | "preadmins" | "demandes">("etabs");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const role = await resolveUserRole();
      setAuthorized(role === "super_admin");
      if (role !== "super_admin") window.location.href = "/";
    })();
  }, []);

  if (authorized === null) return <div className="p-8 text-center">Chargement…</div>;
  if (!authorized) return null;

  return (
    <div className="bg-paper min-h-screen text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            Campus<span className="text-terracotta">Link</span>
            <DrapeauBF className="h-4 w-6" />
            <span className="ml-3 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">Super Admin</span>
          </Link>
          <button onClick={signOutAndGoHome} className="btn-bf-outline text-sm"><LogOut className="h-4 w-4" />Déconnexion</button>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl gap-1 px-6">
          {[
            { k: "etabs", l: "Établissements", i: <Building2 className="h-4 w-4" /> },
            { k: "preadmins", l: "Pré-autorisations admin", i: <UserPlus className="h-4 w-4" /> },
            { k: "demandes", l: "Demandes partenariat", i: <Mail className="h-4 w-4" /> },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as never)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {tab === "etabs" && <EtablissementsPanel />}
        {tab === "preadmins" && <PreAdminsPanel />}
        {tab === "demandes" && <DemandesPanel />}
      </main>
    </div>
  );
}

// ============ Établissements ============
function EtablissementsPanel() {
  const [list, setList] = useState<Etab[]>([]);
  const [form, setForm] = useState<Partial<Etab>>({ statut: "actif" });
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("etablissements").select("*").order("nom");
    setList((data as Etab[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.nom || form.nom.trim().length < 2) { setMsg("Nom requis"); return; }
    const payload = {
      nom: form.nom.trim(),
      email: form.email?.trim() || null,
      telephone: form.telephone?.trim() || null,
      adresse: form.adresse?.trim() || null,
      description: form.description?.trim() || null,
      statut: form.statut || "actif",
    };
    if (editing) {
      const { error } = await supabase.from("etablissements").update(payload).eq("id", editing);
      if (error) { setMsg(error.message); return; }
    } else {
      const { error } = await supabase.from("etablissements").insert(payload);
      if (error) { setMsg(error.message); return; }
    }
    setForm({ statut: "actif" }); setEditing(null); load();
  }

  async function del(id: string) {
    if (!confirm("Supprimer cet établissement ?")) return;
    await supabase.from("etablissements").delete().eq("id", id);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="card-glass rounded-xl p-6">
        <h2 className="mb-4 text-lg font-bold">Établissements ({list.length})</h2>
        {msg && <div className="mb-3 rounded bg-destructive/10 p-2 text-sm text-destructive">{msg}</div>}
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.id} className="flex items-start justify-between rounded-lg border border-border bg-surface p-3">
              <div>
                <div className="font-semibold">{e.nom}</div>
                <div className="text-xs text-muted-foreground">{e.email ?? "—"} · {e.statut}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(e.id); setForm(e); }} className="text-xs text-primary underline">Modifier</button>
                <button onClick={() => del(e.id)} className="text-xs text-destructive underline">Suppr.</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={save} className="card-glass space-y-3 rounded-xl p-6">
        <h3 className="font-bold">{editing ? "Modifier" : "Ajouter"} un établissement</h3>
        <Input label="Nom *" v={form.nom ?? ""} on={(v) => setForm({ ...form, nom: v })} />
        <Input label="Email" v={form.email ?? ""} on={(v) => setForm({ ...form, email: v })} />
        <Input label="Téléphone" v={form.telephone ?? ""} on={(v) => setForm({ ...form, telephone: v })} />
        <Input label="Adresse" v={form.adresse ?? ""} on={(v) => setForm({ ...form, adresse: v })} />
        <div>
          <label className="mb-1 block text-sm">Statut</label>
          <select value={form.statut ?? "actif"} onChange={(e) => setForm({ ...form, statut: e.target.value })}
            className="w-full rounded border border-input bg-surface px-3 py-2">
            <option value="actif">actif</option>
            <option value="inactif">inactif</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-bf-primary flex-1">{editing ? "Enregistrer" : "Ajouter"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ statut: "actif" }); }} className="btn-bf-outline">Annuler</button>}
        </div>
      </form>
    </div>
  );
}

// ============ Pré-autorisations admin ============
function PreAdminsPanel() {
  const [etabs, setEtabs] = useState<Etab[]>([]);
  const [selEtab, setSelEtab] = useState<string>("");
  const [list, setList] = useState<PreAdmin[]>([]);
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("etablissements").select("*").order("nom").then(({ data }) => {
      setEtabs((data as Etab[]) ?? []);
      if (data && data.length && !selEtab) setSelEtab(data[0].id);
    });
  }, []);
  useEffect(() => {
    if (!selEtab) return;
    supabase.from("admins_pre_autorises").select("*").eq("etablissement_id", selEtab).order("nom_complet")
      .then(({ data }) => setList((data as PreAdmin[]) ?? []));
  }, [selEtab]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!selEtab) return;
    const { error } = await supabase.from("admins_pre_autorises").insert({
      etablissement_id: selEtab, ...form, email: form.email.trim().toLowerCase(),
    });
    if (error) { setMsg(error.message); return; }
    setForm({ nom_complet: "", email: "", date_naissance: "" });
    const { data } = await supabase.from("admins_pre_autorises").select("*").eq("etablissement_id", selEtab).order("nom_complet");
    setList((data as PreAdmin[]) ?? []);
  }

  async function del(id: string) {
    await supabase.from("admins_pre_autorises").delete().eq("id", id);
    setList((l) => l.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="card-glass rounded-xl p-6">
        <label className="mb-2 block text-sm">Établissement</label>
        <select value={selEtab} onChange={(e) => setSelEtab(e.target.value)}
          className="w-full max-w-md rounded border border-input bg-surface px-3 py-2">
          {etabs.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="card-glass rounded-xl p-6">
          <h3 className="mb-3 font-bold">Administrateurs pré-autorisés ({list.length})</h3>
          <div className="space-y-2">
            {list.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-border bg-surface p-3 text-sm">
                <div>
                  <div className="font-semibold">{p.nom_complet}</div>
                  <div className="text-xs text-muted-foreground">{p.email} · né(e) le {p.date_naissance} · {p.inscrit ? "inscrit" : "en attente"}</div>
                </div>
                <button onClick={() => del(p.id)} className="text-xs text-destructive underline">Suppr.</button>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun administrateur pré-autorisé.</p>}
          </div>
        </div>

        <form onSubmit={add} className="card-glass space-y-3 rounded-xl p-6">
          <h3 className="font-bold">Pré-autoriser un administrateur</h3>
          {msg && <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">{msg}</div>}
          <Input label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
          <Input label="Email" v={form.email} on={(v) => setForm({ ...form, email: v })} type="email" />
          <Input label="Date de naissance" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} type="date" />
          <button type="submit" className="btn-bf-primary w-full">Ajouter</button>
        </form>
      </div>
    </div>
  );
}

// ============ Demandes de partenariat ============
function DemandesPanel() {
  const [list, setList] = useState<Demande[]>([]);
  useEffect(() => {
    supabase.from("demandes_partenariat").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setList((data as Demande[]) ?? []));
  }, []);
  async function setStatut(id: string, statut: string) {
    await supabase.from("demandes_partenariat").update({ statut }).eq("id", id);
    setList((l) => l.map((d) => (d.id === id ? { ...d, statut } : d)));
  }
  return (
    <div className="card-glass rounded-xl p-6">
      <h2 className="mb-4 text-lg font-bold">Demandes de partenariat ({list.length})</h2>
      <div className="space-y-3">
        {list.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{d.nom_etablissement}</div>
                <div className="text-sm text-muted-foreground">
                  {d.nom_contact} · {d.email_contact}{d.telephone_contact ? ` · ${d.telephone_contact}` : ""}
                </div>
                {d.message && <p className="mt-2 text-sm">{d.message}</p>}
                <div className="mt-2 text-xs text-muted-foreground">
                  Statut : <span className="font-semibold">{d.statut}</span> · reçu le {new Date(d.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <select value={d.statut} onChange={(e) => setStatut(d.id, e.target.value)}
                className="rounded border border-input bg-surface px-2 py-1 text-sm">
                <option value="en_attente">en attente</option>
                <option value="acceptee">acceptée</option>
                <option value="refusee">refusée</option>
              </select>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
      </div>
    </div>
  );
}

function Input({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input type={type} value={v} onChange={(e) => on(e.target.value)}
        className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
    </div>
  );
}
