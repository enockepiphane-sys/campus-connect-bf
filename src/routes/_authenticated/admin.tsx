import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";
import { parseCSV } from "@/lib/csv";
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
    await supabase.from("niveaux").delete().eq("id", id); load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-soft p-6">
        <h2 className="mb-3 font-bold">Filières</h2>
        <form onSubmit={addFil} className="mb-3 flex gap-2">
          <input value={nfil} onChange={(e) => setNfil(e.target.value)} placeholder="Nom de la filière"
            className="flex-1 input-soft" />
          <button className="btn-forest">Ajouter</button>
        </form>
        <ul className="space-y-2">
          {filieres.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-[10px] border border-border bg-surface p-2 text-sm">
              <span>{f.nom}</span>
              <button onClick={() => delFil(f.id)} className="text-xs text-destructive underline">Suppr.</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-soft p-6">
        <h2 className="mb-3 font-bold">Niveaux</h2>
        <form onSubmit={addNiv} className="mb-3 space-y-2">
          <select value={nniv.filiere_id} onChange={(e) => setNniv({ ...nniv, filiere_id: e.target.value })}
            className="w-full input-soft" required>
            <option value="">— Filière —</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={nniv.nom} onChange={(e) => setNniv({ ...nniv, nom: e.target.value })} placeholder="Nom (ex: L1)"
              className="flex-1 input-soft" />
            <input type="number" value={nniv.ordre} onChange={(e) => setNniv({ ...nniv, ordre: e.target.value })}
              className="w-20 input-soft" />
            <button className="btn-forest">Ajouter</button>
          </div>
        </form>
        <ul className="space-y-2">
          {filieres.map((f) => (
            <li key={f.id}>
              <div className="mb-1 text-xs font-bold text-muted-foreground">{f.nom}</div>
              <div className="space-y-1">
                {niveaux.filter((n) => n.filiere_id === f.id).map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded-[10px] border border-border bg-surface p-2 text-sm">
                    <span>{n.ordre}. {n.nom}</span>
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
  const [matieres, setMatieres] = useState<{ id: string; nom: string; coefficient: number; credits: number }[]>([]);
  const [nMat, setNMat] = useState({ nom: "", coefficient: "1", credits: "1" });
  const [selMat, setSelMat] = useState<string>("");
  const [notes, setNotes] = useState<{ id: string; etudiant_user_id: string; valeur: number; type_evaluation: string; commentaire: string | null }[]>([]);
  const [etudiants, setEtudiants] = useState<{ user_id: string; nom_complet: string; email: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!niveauId) { setMatieres([]); setEtudiants([]); return; }
    supabase.from("matieres").select("id,nom,coefficient,credits").eq("niveau_id", niveauId).order("nom")
      .then(({ data }) => setMatieres((data as never) ?? []));
    supabase.from("etudiants_pre_inscrits").select("user_id,nom_complet,email").eq("niveau_id", niveauId).eq("inscrit", true)
      .then(({ data }) => setEtudiants(((data ?? []).filter((e) => e.user_id)) as never));
  }, [niveauId]);

  useEffect(() => {
    if (!selMat) { setNotes([]); return; }
    supabase.from("notes").select("id,etudiant_user_id,valeur,type_evaluation,commentaire").eq("matiere_id", selMat)
      .then(({ data }) => setNotes((data as never) ?? []));
  }, [selMat]);

  async function addMat(e: React.FormEvent) {
    e.preventDefault();
    if (!niveauId || !nMat.nom.trim()) return;
    await supabase.from("matieres").insert({ niveau_id: niveauId, nom: nMat.nom.trim(), coefficient: Number(nMat.coefficient) || 1, credits: Number(nMat.credits) || 0 });
    setNMat({ nom: "", coefficient: "1", credits: "1" });
    const { data } = await supabase.from("matieres").select("id,nom,coefficient,credits").eq("niveau_id", niveauId).order("nom");
    setMatieres((data as never) ?? []);
  }

  async function importNotes(file: File) {
    setMsg(null);
    if (!selMat) { setMsg("Sélectionnez une matière"); return; }
    const text = await file.text();
    const { rows } = parseCSV(text);
    // colonnes attendues : email, valeur, type_evaluation, commentaire
    const emailMap = new Map(etudiants.map((e) => [e.email.toLowerCase(), e.user_id]));
    const payload: { etudiant_user_id: string; matiere_id: string; valeur: number; type_evaluation: string; commentaire: string | null }[] = [];
    let skipped = 0;
    for (const r of rows) {
      const uid = emailMap.get((r.email ?? "").trim().toLowerCase());
      const val = Number((r.valeur ?? "").replace(",", "."));
      if (!uid || Number.isNaN(val)) { skipped++; continue; }
      payload.push({
        etudiant_user_id: uid, matiere_id: selMat, valeur: val,
        type_evaluation: r.type_evaluation?.trim() || "devoir",
        commentaire: r.commentaire?.trim() || null,
      });
    }
    if (!payload.length) { setMsg(`Aucune ligne valide (ignorées: ${skipped})`); return; }
    const { error } = await supabase.from("notes").insert(payload);
    if (error) setMsg(error.message);
    else {
      setMsg(`${payload.length} note(s) importée(s), ${skipped} ignorée(s).`);
      const { data } = await supabase.from("notes").select("id,etudiant_user_id,valeur,type_evaluation,commentaire").eq("matiere_id", selMat);
      setNotes((data as never) ?? []);
    }
  }

  const etuName = (uid: string) => etudiants.find((e) => e.user_id === uid)?.nom_complet ?? uid.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <label className="mb-2 block text-sm">Niveau</label>
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>

      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-soft p-6">
            <h3 className="mb-3 font-bold">Matières</h3>
            <form onSubmit={addMat} className="mb-3 grid grid-cols-[1fr_5rem_5rem_auto] gap-2">
              <input value={nMat.nom} onChange={(e) => setNMat({ ...nMat, nom: e.target.value })} placeholder="Nom"
                className="input-soft" />
              <input type="number" step="0.1" value={nMat.coefficient} onChange={(e) => setNMat({ ...nMat, coefficient: e.target.value })}
                className="input-soft" title="Coefficient" placeholder="Coef" />
              <input type="number" min="0" step="1" value={nMat.credits} onChange={(e) => setNMat({ ...nMat, credits: e.target.value })}
                className="input-soft" title="Crédits" placeholder="Crédits" />
              <button className="btn-forest">+</button>
            </form>
            <ul className="space-y-1">
              {matieres.map((m) => (
                <li key={m.id}>
                  <button onClick={() => setSelMat(m.id)}
                    className={`w-full rounded-[10px] border p-2 text-left text-sm transition ${selMat === m.id ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-muted"}`}>
                    <span className="font-semibold">{m.nom}</span>{" "}
                    <span className="text-xs text-muted-foreground">· coef {m.coefficient}</span>{" "}
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{m.credits} crédit{m.credits > 1 ? "s" : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-soft p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Notes {selMat ? `(${notes.length})` : ""}</h3>
              {selMat && (
                <label className="btn-bf-outline cursor-pointer text-sm">
                  <Upload className="icon-tinted h-4 w-4" />Import CSV
                  <input hidden type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importNotes(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {msg && <div className="mb-3 rounded bg-primary-soft p-2 text-sm text-primary">{msg}</div>}
            {!selMat && <p className="text-sm text-muted-foreground">Sélectionnez une matière.</p>}
            {selMat && (
              <div className="space-y-1">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded-[10px] border border-border bg-surface p-2 text-sm">
                    <span>{etuName(n.etudiant_user_id)} — <strong>{n.valeur}</strong> <span className="text-xs text-muted-foreground">({n.type_evaluation})</span></span>
                    <button onClick={async () => { await supabase.from("notes").delete().eq("id", n.id); setNotes((l) => l.filter((x) => x.id !== n.id)); }}
                      className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-sm text-muted-foreground">Aucune note.</p>}
                <p className="mt-3 text-xs text-muted-foreground">CSV attendu : <code>email, valeur, type_evaluation, commentaire</code>. Seuls les étudiants inscrits sont pris en compte.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------- Annonces --------------
function AnnoncesPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<{ id: string; titre: string; contenu: string; created_at: string; is_urgent: boolean; comments_enabled: boolean; max_comments: number }[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ titre: "", contenu: "", is_urgent: false, comments_enabled: false, max_comments: "10" });

  async function load() {
    if (!niveauId) { setList([]); setLikes({}); return; }
    const { data } = await supabase.from("annonces").select("id,titre,contenu,created_at,is_urgent,comments_enabled,max_comments").eq("niveau_id", niveauId).order("created_at", { ascending: false });
    const rows = (data as never as typeof list) ?? [];
    setList(rows);
    if (rows.length) {
      const { data: lk } = await supabase.from("announcement_likes").select("announcement_id").in("announcement_id", rows.map((a) => a.id));
      const counts: Record<string, number> = {};
      ((lk as { announcement_id: string }[]) ?? []).forEach((l) => { counts[l.announcement_id] = (counts[l.announcement_id] ?? 0) + 1; });
      setLikes(counts);
    } else setLikes({});
  }
  useEffect(() => { load(); }, [niveauId]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!niveauId) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("annonces").insert({
      niveau_id: niveauId,
      titre: form.titre.trim(),
      contenu: form.contenu.trim(),
      is_urgent: form.is_urgent,
      comments_enabled: form.comments_enabled,
      max_comments: Math.max(1, Number(form.max_comments) || 10),
      created_by: u.user?.id,
    });
    setForm({ titre: "", contenu: "", is_urgent: false, comments_enabled: false, max_comments: "10" }); load();
  }

  async function toggle(id: string, field: "is_urgent" | "comments_enabled", value: boolean) {
    const patch = field === "is_urgent" ? { is_urgent: value } : { comments_enabled: value };
    await supabase.from("annonces").update(patch).eq("id", id);
    load();
  }

  async function setMaxComments(id: string, value: number) {
    await supabase.from("annonces").update({ max_comments: Math.max(1, value) }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="card-soft p-6">
            <h3 className="mb-3 font-bold">Annonces ({list.length})</h3>
            <div className="space-y-3">
              {list.map((a) => (
                <article key={a.id} className="rounded-[10px] border border-border bg-surface p-4">
                  <div className="flex justify-between">
                    <h4 className="font-semibold">
                      {a.is_urgent && <span className="mr-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">🚨 URGENT</span>}
                      {a.titre}
                    </h4>
                    <button onClick={async () => { await supabase.from("annonces").delete().eq("id", a.id); load(); }}
                      className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.contenu}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5">
                      <Heart className="icon-terracotta h-3.5 w-3.5 fill-current" />
                      <span className="font-semibold">{likes[a.id] ?? 0}</span> like{(likes[a.id] ?? 0) > 1 ? "s" : ""}
                    </span>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={a.is_urgent} onChange={(e) => toggle(a.id, "is_urgent", e.target.checked)} />
                      Marquer comme urgent
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={a.comments_enabled} onChange={(e) => toggle(a.id, "comments_enabled", e.target.checked)} />
                      Autoriser les commentaires
                    </label>
                    {a.comments_enabled && (
                      <label className="flex items-center gap-1.5">
                        Nombre maximum de commentaires
                        <input type="number" min="1" defaultValue={a.max_comments}
                          onBlur={(e) => { const v = Number(e.target.value); if (v && v !== a.max_comments) setMaxComments(a.id, v); }}
                          className="input-soft w-20 py-1" />
                      </label>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
                  {a.comments_enabled && <AdminComments annonceId={a.id} />}
                </article>
              ))}
              {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune annonce.</p>}
            </div>
          </div>
          <form onSubmit={add} className="card-soft space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Nouvelle annonce</h3>
            <SmInput label="Titre" v={form.titre} on={(v) => setForm({ ...form, titre: v })} />
            <div>
              <label className="mb-1 block text-sm">Contenu</label>
              <textarea required rows={5} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                className="w-full input-soft" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_urgent} onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })} />
              Marquer comme urgent
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.comments_enabled} onChange={(e) => setForm({ ...form, comments_enabled: e.target.checked })} />
              Autoriser les commentaires
            </label>
            {form.comments_enabled && (
              <div>
                <label className="mb-1 block text-sm">Nombre maximum de commentaires</label>
                <input type="number" min="1" value={form.max_comments}
                  onChange={(e) => setForm({ ...form, max_comments: e.target.value })}
                  className="input-soft w-full" />
              </div>
            )}
            <button className="btn-forest w-full">Publier</button>
          </form>
        </div>
      )}
    </div>
  );
}

function AdminComments({ annonceId }: { annonceId: string }) {
  const [list, setList] = useState<{ id: string; content: string; created_at: string; user_id: string }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase.from("announcement_comments")
      .select("id,content,created_at,user_id").eq("announcement_id", annonceId)
      .order("created_at", { ascending: false });
    const rows = (data as never as typeof list) ?? [];
    setList(rows);
    const ids = Array.from(new Set(rows.map((c) => c.user_id)));
    if (ids.length) {
      const { data: etus } = await supabase.from("etudiants_pre_inscrits").select("user_id,nom_complet").in("user_id", ids);
      const m: Record<string, string> = {};
      (etus ?? []).forEach((e) => { if (e.user_id) m[e.user_id] = e.nom_complet; });
      setNames(m);
    }
  }
  useEffect(() => { load(); }, [annonceId]);

  if (!list.length) return <p className="mt-2 text-xs text-muted-foreground">Aucun commentaire.</p>;
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {list.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
          <div>
            <span className="font-medium">{names[c.user_id] ?? "Étudiant"}</span>{" "}
            <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
            <p className="whitespace-pre-wrap">{c.content}</p>
          </div>
          <button
            onClick={async () => { await supabase.from("announcement_comments").delete().eq("id", c.id); load(); }}
            className="shrink-0 text-xs text-destructive underline">Suppr.</button>
        </div>
      ))}
    </div>
  );
}


// -------------- Événements --------------
function EvenementsPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<{ id: string; titre: string; description: string | null; date_evenement: string; lieu: string | null; affiche_url: string | null }[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ titre: "", description: "", date_evenement: "", lieu: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    if (!niveauId) { setList([]); setUrls({}); return; }
    const { data } = await supabase.from("evenements").select("*").eq("niveau_id", niveauId).order("date_evenement");
    const rows = (data as never as typeof list) ?? [];
    setList(rows);
    setUrls(await afficheUrls(rows.map((e) => e.affiche_url)));
  }
  useEffect(() => { load(); }, [niveauId]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!niveauId || busy) return;
    setBusy(true); setErr("");
    let affiche: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${niveauId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(AFFICHES_BUCKET).upload(path, file, { contentType: file.type });
      if (error) { setErr("Échec de l'envoi de l'affiche : " + error.message); setBusy(false); return; }
      affiche = path;
    }
    const { error } = await supabase.from("evenements").insert({
      niveau_id: niveauId, titre: form.titre.trim(), description: form.description.trim() || null,
      date_evenement: form.date_evenement, lieu: form.lieu.trim() || null, affiche_url: affiche,
    });
    if (error) setErr(error.message);
    else { setForm({ titre: "", description: "", date_evenement: "", lieu: "" }); setFile(null); await load(); }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="card-soft p-6">
            <h3 className="mb-3 flex items-center gap-2 font-bold"><Calendar className="icon-gold h-5 w-5" />Événements ({list.length})</h3>
            <div className="space-y-3">
              {list.map((e) => {
                const img = e.affiche_url ? urls[e.affiche_url] : null;
                return (
                  <div key={e.id} className="overflow-hidden rounded-[10px] border border-border bg-surface">
                    {img && <img src={img} alt={`Affiche de ${e.titre}`} loading="lazy" className="h-36 w-full object-cover" />}
                    <div className="flex justify-between p-3">
                      <div>
                        <h4 className="font-semibold">{e.titre}</h4>
                        <p className="text-xs text-muted-foreground">{new Date(e.date_evenement).toLocaleString("fr-FR")}{e.lieu ? ` · ${e.lieu}` : ""}</p>
                        {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                      </div>
                      <button onClick={async () => { await supabase.from("evenements").delete().eq("id", e.id); load(); }}
                        className="text-xs text-destructive underline">Suppr.</button>
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
            </div>
          </div>
          <form onSubmit={add} className="card-soft space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Nouvel événement</h3>
            <SmInput label="Titre" v={form.titre} on={(v) => setForm({ ...form, titre: v })} />
            <SmInput label="Date & heure" type="datetime-local" v={form.date_evenement} on={(v) => setForm({ ...form, date_evenement: v })} />
            <SmInput label="Lieu" v={form.lieu} on={(v) => setForm({ ...form, lieu: v })} />
            <div>
              <label className="mb-1 block text-sm">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full input-soft" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm"><ImagePlus className="icon-terracotta h-4 w-4" />Affiche (image)</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm" />
              {file && <p className="mt-1 truncate text-xs text-muted-foreground">{file.name}</p>}
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <button className="btn-forest w-full" disabled={busy}>{busy ? "Envoi…" : "Ajouter"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

// -------------- Emploi du temps (grille hebdomadaire) --------------
function EDTPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<Creneau[]>([]);
  const [cell, setCell] = useState<{ jour: number; slot: string } | null>(null);
  const [form, setForm] = useState({ matiere: "", enseignant: "", salle: "", duree: "2" });
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("emplois_du_temps").select("*").eq("niveau_id", niveauId).order("jour_semaine").order("heure_debut");
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!niveauId || !cell || !form.matiere.trim() || busy) return;
    setBusy(true);
    await supabase.from("emplois_du_temps").insert({
      niveau_id: niveauId,
      jour_semaine: cell.jour,
      heure_debut: cell.slot,
      heure_fin: addMinutes(cell.slot, (Number(form.duree) || 1) * SLOT_MINUTES),
      matiere: form.matiere.trim(),
      salle: form.salle.trim() || null,
      enseignant: form.enseignant.trim() || null,
    });
    setForm({ matiere: "", enseignant: "", salle: "", duree: "2" });
    setCell(null);
    await load();
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="card-soft overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Clock className="icon-teal h-5 w-5" />
            <h3 className="font-bold">Grille hebdomadaire</h3>
            <span className="text-xs text-muted-foreground">Cliquez sur une case libre pour ajouter un cours</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-16 border-b border-border p-2 text-left font-medium text-muted-foreground">Heure</th>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <th key={j} className="border-b border-l border-border p-2 font-semibold">{JOURS_LONGS[j - 1]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot}>
                    <td className="border-b border-border p-1.5 align-top font-mono text-[11px] text-muted-foreground">{slot}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => {
                      const c = creneauAt(list, j, slot);
                      if (c) {
                        return (
                          <td key={j} rowSpan={spanOf(c)} className="border-b border-l border-border p-1 align-top">
                            <div className="group relative h-full rounded-[10px] bg-primary-soft p-2 leading-tight">
                              <p className="font-semibold text-primary">{c.matiere}</p>
                              {c.enseignant && <p className="text-[11px] text-muted-foreground">{c.enseignant}</p>}
                              {c.salle && <p className="text-[11px] text-muted-foreground">{c.salle}</p>}
                              <button onClick={async () => { await supabase.from("emplois_du_temps").delete().eq("id", c.id); load(); }}
                                className="mt-1 text-[10px] text-destructive underline">Suppr.</button>
                            </div>
                          </td>
                        );
                      }
                      if (isCovered(list, j, slot)) return null;
                      const active = cell?.jour === j && cell?.slot === slot;
                      return (
                        <td key={j} className="border-b border-l border-border p-1 align-top">
                          <button onClick={() => setCell(active ? null : { jour: j, slot })}
                            className={`flex h-8 w-full items-center justify-center rounded-[8px] transition ${active ? "bg-accent" : "hover:bg-muted"}`}
                            aria-label={`Ajouter un cours ${JOURS_LONGS[j - 1]} à ${slot}`}>
                            <Plus className={`h-3.5 w-3.5 ${active ? "text-accent-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cell && (
            <form onSubmit={save} className="grid gap-3 border-t border-border p-5 sm:grid-cols-5">
              <div className="sm:col-span-5 text-sm font-semibold text-primary">
                {JOURS_LONGS[cell.jour - 1]} · {cell.slot}
              </div>
              <SmInput label="Matière" v={form.matiere} on={(v) => setForm({ ...form, matiere: v })} />
              <SmInput label="Professeur" v={form.enseignant} on={(v) => setForm({ ...form, enseignant: v })} />
              <SmInput label="Salle" v={form.salle} on={(v) => setForm({ ...form, salle: v })} />
              <div>
                <label className="mb-1 block text-sm">Durée</label>
                <select value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} className="w-full input-soft">
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n * SLOT_MINUTES} min</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button className="btn-forest flex-1" disabled={busy}>Ajouter</button>
                <button type="button" onClick={() => setCell(null)} className="btn-bf-outline">Annuler</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function SmInput({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input required={label !== "Salle" && label !== "Enseignant"} type={type} value={v} onChange={(e) => on(e.target.value)}
        className="w-full input-soft outline-none focus:border-primary" />
    </div>
  );
}
