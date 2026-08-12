import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";

import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, GraduationCap, BookOpen, Users, Megaphone, Calendar, Clock, Upload, Menu, X, Heart, ImagePlus, Plus } from "lucide-react";
import { BLOCS, JOURS, JOURS_LONGS, coursOf, hhmm, type Bloc, type Cours } from "@/lib/edt";
import { appreciation } from "@/lib/notes";
import { afficheUrls, AFFICHES_BUCKET } from "@/lib/affiches";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Dashboard,
});

type Etab = { id: string; nom: string };
type Filiere = { id: string; nom: string };
type Niveau = { id: string; nom: string; ordre: number; filiere_id: string };

function Dashboard() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [etabId, setEtabId] = useState<string | null>(null);
  const [etabNom, setEtabNom] = useState<string>("");
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState<"structure" | "etudiants" | "matieres" | "annonces" | "evenements" | "edt">("structure");

  useEffect(() => {
    (async () => {
      const role = await resolveUserRole();
      if (role !== "admin") { window.location.href = "/"; return; }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: r } = await supabase.from("user_roles").select("etablissement_id").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!r?.etablissement_id) { window.location.href = "/"; return; }
      setEtabId(r.etablissement_id);
      const { data: e } = await supabase.from("etablissements").select("nom").eq("id", r.etablissement_id).maybeSingle();
      setEtabNom(e?.nom ?? "");
      setOk(true);
    })();
  }, []);

  if (ok === null) return <div className="p-8 text-center">Chargement…</div>;
  if (!etabId) return null;

  const sections = [
    { k: "structure", l: "Filières & niveaux", i: BookOpen, c: "icon-green" },
    { k: "etudiants", l: "Étudiants", i: Users, c: "icon-blue" },
    { k: "matieres", l: "Matières & notes", i: GraduationCap, c: "icon-violet" },
    { k: "annonces", l: "Annonces", i: Megaphone, c: "icon-terracotta" },
    { k: "evenements", l: "Événements", i: Calendar, c: "icon-gold" },
    { k: "edt", l: "Emploi du temps", i: Clock, c: "icon-teal" },
  ] as const;
  const current = sections.find((s) => s.k === tab);

  return (
    <div className="bg-app min-h-screen w-full max-w-full overflow-x-hidden text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              onClick={() => setMenu(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border text-foreground transition hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex min-w-0 flex-wrap items-center gap-2 font-display text-lg font-bold sm:text-xl">
              <span className="whitespace-nowrap">Campus<span className="text-terracotta">Link</span></span>
              <DrapeauBF className="h-4 w-6 shrink-0" />
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground sm:px-3 sm:py-1 sm:text-xs">Admin · {etabNom}</span>
            </Link>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{current?.l}</span>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <aside className="flex w-72 max-w-[85%] flex-col border-r border-border bg-surface p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-base font-bold">Menu</span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setMenu(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {sections.map((s) => (
                <button
                  key={s.k}
                  onClick={() => { setTab(s.k as never); setMenu(false); }}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition ${tab === s.k ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <s.i className={`h-4 w-4 shrink-0 ${s.c}`} />
                  {s.l}
                </button>
              ))}
            </nav>
            <button onClick={signOutAndGoHome} className="btn-bf-outline mt-4 w-full text-sm">
              <LogOut className="icon-danger h-4 w-4" />Déconnexion
            </button>
          </aside>
          <button aria-label="Fermer" onClick={() => setMenu(false)} className="flex-1 bg-foreground/40 backdrop-blur-sm" />
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-8">
        {tab === "structure" && <StructurePanel etabId={etabId} />}
        {tab === "etudiants" && <EtudiantsPanel etabId={etabId} />}
        {tab === "matieres" && <MatieresPanel etabId={etabId} />}
        {tab === "annonces" && <AnnoncesPanel etabId={etabId} />}
        {tab === "evenements" && <EvenementsPanel etabId={etabId} />}
        {tab === "edt" && <EDTPanel etabId={etabId} />}
      </main>
    </div>
  );
}

// -------------- Structure : Filières + Niveaux --------------
function StructurePanel({ etabId }: { etabId: string }) {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [nfil, setNfil] = useState("");
  const [nniv, setNniv] = useState({ filiere_id: "", nom: "", ordre: "1" });

  async function load() {
    const { data: f } = await supabase.from("filieres").select("id,nom").eq("etablissement_id", etabId).order("nom");
    setFilieres((f as Filiere[]) ?? []);
    const ids = (f ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: n } = await supabase.from("niveaux").select("id,nom,ordre,filiere_id").in("filiere_id", ids).order("ordre");
      setNiveaux((n as Niveau[]) ?? []);
    } else setNiveaux([]);
  }
  useEffect(() => { load(); }, [etabId]);

  async function addFil(e: React.FormEvent) {
    e.preventDefault();
    if (!nfil.trim()) return;
    await supabase.from("filieres").insert({ etablissement_id: etabId, nom: nfil.trim() });
    setNfil(""); load();
  }
  async function delFil(id: string) {
    if (!confirm("Supprimer cette filière et tous ses niveaux ?")) return;
    const f = filieres.find((x) => x.id === id);
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "filieres",
      _record_id: id,
      _description: `Suppression de la filière "${f?.nom ?? id}"`,
      _ancienne_valeur: f ?? null,
      _nouvelle_valeur: null,
    });
    await supabase.from("filieres").delete().eq("id", id); load();
  }
  async function addNiv(e: React.FormEvent) {
    e.preventDefault();
    if (!nniv.filiere_id || !nniv.nom.trim()) return;
    await supabase.from("niveaux").insert({ filiere_id: nniv.filiere_id, nom: nniv.nom.trim(), ordre: Number(nniv.ordre) || 1 });
    setNniv({ filiere_id: nniv.filiere_id, nom: "", ordre: "1" }); load();
  }
  async function delNiv(id: string) {
    if (!confirm("Supprimer ce niveau ?")) return;
    const n = niveaux.find((x) => x.id === id);
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "niveaux",
      _record_id: id,
      _description: `Suppression du niveau "${n?.nom ?? id}"`,
      _ancienne_valeur: n ?? null,
      _nouvelle_valeur: null,
    });
    await supabase.from("niveaux").delete().eq("id", id); load();
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="card-soft min-w-0 p-6">
        <h2 className="mb-3 font-bold">Filières</h2>
        <form onSubmit={addFil} className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input value={nfil} onChange={(e) => setNfil(e.target.value)} placeholder="Nom de la filière"
            className="input-soft min-w-0 w-full" />
          <button className="btn-forest w-full sm:w-auto">Ajouter</button>
        </form>
        <ul className="space-y-2">
          {filieres.map((f) => (
            <li key={f.id} className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] border border-border bg-surface p-2 text-sm">
              <span className="truncate">{f.nom}</span>
              <button onClick={() => delFil(f.id)} className="text-xs text-destructive underline">Suppr.</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-soft min-w-0 p-6">
        <h2 className="mb-3 font-bold">Niveaux</h2>
        <form onSubmit={addNiv} className="mb-3 space-y-2">
          <select value={nniv.filiere_id} onChange={(e) => setNniv({ ...nniv, filiere_id: e.target.value })}
            className="w-full input-soft" required>
            <option value="">— Filière —</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
            <input value={nniv.nom} onChange={(e) => setNniv({ ...nniv, nom: e.target.value })} placeholder="Nom (ex: L1)"
              className="input-soft min-w-0 w-full" />
            <input type="number" value={nniv.ordre} onChange={(e) => setNniv({ ...nniv, ordre: e.target.value })}
              className="input-soft min-w-0 w-full" />
            <button className="btn-forest w-full sm:w-auto">Ajouter</button>
          </div>
        </form>
        <ul className="space-y-2">
          {filieres.map((f) => (
            <li key={f.id}>
              <div className="mb-1 text-xs font-bold text-muted-foreground">{f.nom}</div>
              <div className="space-y-1">
                {niveaux.filter((n) => n.filiere_id === f.id).map((n) => (
                  <div key={n.id} className="flex min-w-0 items-center justify-between gap-2 rounded-[10px] border border-border bg-surface p-2 text-sm">
                    <span className="truncate">{n.ordre}. {n.nom}</span>
                    <button onClick={() => delNiv(n.id)} className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// -------------- Sélecteur niveau partagé --------------
function useNiveauxOfEtab(etabId: string) {
  const [items, setItems] = useState<{ niveau_id: string; label: string }[]>([]);
  useEffect(() => {
    (async () => {
      const { data: fil } = await supabase.from("filieres").select("id,nom").eq("etablissement_id", etabId).order("nom");
      const ids = (fil ?? []).map((f) => f.id);
      if (!ids.length) { setItems([]); return; }
      const { data: niv } = await supabase.from("niveaux").select("id,nom,ordre,filiere_id").in("filiere_id", ids).order("ordre");
      const filMap = new Map((fil ?? []).map((f) => [f.id, f.nom]));
      setItems((niv ?? []).map((n) => ({ niveau_id: n.id, label: `${filMap.get(n.filiere_id) ?? ""} — ${n.nom}` })));
    })();
  }, [etabId]);
  return items;
}

function NiveauPicker({ items, value, onChange }: { items: { niveau_id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md input-soft">
      <option value="">— Niveau —</option>
      {items.map((n) => <option key={n.niveau_id} value={n.niveau_id}>{n.label}</option>)}
    </select>
  );
}

// -------------- Étudiants --------------
function EtudiantsPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<{ id: string; nom_complet: string; email: string; date_naissance: string; inscrit: boolean }[]>([]);
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const niv = useMemo(() => niveaux.find((n) => n.niveau_id === niveauId), [niveaux, niveauId]);

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("etudiants_pre_inscrits").select("id,nom_complet,email,date_naissance,inscrit")
      .eq("niveau_id", niveauId).order("nom_complet");
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!niveauId) return;
    const { data: n } = await supabase.from("niveaux").select("filiere_id").eq("id", niveauId).maybeSingle();
    if (!n) return;
    const { error } = await supabase.from("etudiants_pre_inscrits").insert({
      etablissement_id: etabId, filiere_id: n.filiere_id, niveau_id: niveauId,
      nom_complet: form.nom_complet.trim(), email: form.email.trim().toLowerCase(), date_naissance: form.date_naissance,
    });
    if (error) { setMsg(error.message); return; }
    setForm({ nom_complet: "", email: "", date_naissance: "" }); load();
  }

  async function importCSV(file: File) {
    setMsg(null);
    if (!niveauId) { setMsg("Sélectionnez un niveau"); return; }
    setBusy(true);
    try {
      const text = await file.text();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée. Reconnectez-vous.");
      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text, niveauId }),
      });
      const json = await res.json().catch(() => ({ error: "Échec de l'import CSV" }));
      if (!res.ok) throw new Error(json.message || json.error || "Échec de l'import CSV");
      setMsg(`${json.imported} étudiant(s) importé(s)`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec de l'import CSV");
    } finally {
      setBusy(false);
      load();
    }
  }

  async function del(id: string) {
    const etu = list.find((x) => x.id === id);
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "etudiants_pre_inscrits",
      _record_id: id,
      _description: `Suppression de l'étudiant "${etu?.nom_complet ?? id}"`,
      _ancienne_valeur: etu ?? null,
      _nouvelle_valeur: null,
    });
    await supabase.from("etudiants_pre_inscrits").delete().eq("id", id); load();
  }

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <label className="mb-2 block text-sm">Niveau</label>
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card-soft p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Étudiants pré-inscrits ({list.length}) — {niv?.label}</h3>
              <label className="btn-bf-outline cursor-pointer text-sm">
                <Upload className="icon-tinted h-4 w-4" />Import CSV
                <input hidden type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = ""; }} />
              </label>
            </div>
            {msg && <div className="mb-3 rounded bg-primary-soft p-2 text-sm text-primary">{msg}</div>}
            <div className="space-y-1">
              {list.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-[10px] border border-border bg-surface p-2 text-sm">
                  <div>
                    <span className="font-semibold">{e.nom_complet}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{e.email} · {e.date_naissance} · {e.inscrit ? "✓ inscrit" : "en attente"}</span>
                  </div>
                  <button onClick={() => del(e.id)} className="text-xs text-destructive underline">Suppr.</button>
                </div>
              ))}
              {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun étudiant.</p>}
            </div>
          </div>

          <form onSubmit={add} className="card-soft space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Ajouter un étudiant</h3>
            <SmInput label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
            <SmInput label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
            <SmInput label="Date de naissance" type="date" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} />
            <button className="btn-forest w-full">Ajouter</button>
            <p className="text-xs text-muted-foreground">CSV attendu : colonnes <code>nom_complet, email, date_naissance</code> (YYYY-MM-DD).</p>
          </form>
        </div>
      )}
    </div>
  );
}

// -------------- Matières & Notes --------------
function MatieresPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [matieres, setMatieres] = useState<{ id: string; nom: string; credits: number }[]>([]);
  const [nMat, setNMat] = useState({ nom: "", credits: "1" });
  const [selMat, setSelMat] = useState<string>("");
  const [notes, setNotes] = useState<{ id: string; etudiant_user_id: string; valeur: number; type_evaluation: string; commentaire: string | null }[]>([]);
  const [etudiants, setEtudiants] = useState<{ user_id: string; nom_complet: string; email: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!niveauId) { setMatieres([]); setEtudiants([]); setSelMat(""); setNotes([]); setSaisie({}); return; }
    setSelMat(""); setNotes([]); setSaisie({}); setMsg(null);
    Promise.all([
      supabase.from("matieres").select("id,nom,credits").eq("niveau_id", niveauId).order("nom"),
      supabase.from("etudiants_pre_inscrits").select("user_id,nom_complet,email").eq("niveau_id", niveauId).eq("inscrit", true),
    ]).then(([{ data: mats }, { data: etus }]) => {
      setMatieres((mats as never) ?? []);
      setEtudiants(((etus ?? []).filter((e) => e.user_id)) as never);
    });
  }, [niveauId]);

  useEffect(() => {
    if (!selMat) { setNotes([]); return; }
    supabase.from("notes").select("id,etudiant_user_id,valeur,type_evaluation,commentaire").eq("matiere_id", selMat)
      .then(({ data }) => setNotes((data as never) ?? []));
  }, [selMat]);

  async function addMat(e: React.FormEvent) {
    e.preventDefault();
    i
