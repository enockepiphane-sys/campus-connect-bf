import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";
import { parseCSV } from "@/lib/csv";
import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, GraduationCap, BookOpen, Users, Megaphone, Calendar, Clock, Upload } from "lucide-react";

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

  return (
    <div className="bg-paper min-h-screen text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 flex-wrap items-center gap-2 font-display text-lg font-bold sm:text-xl">
            <span className="whitespace-nowrap">Campus<span className="text-terracotta">Link</span></span>
            <DrapeauBF className="h-4 w-6 shrink-0" />
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground sm:px-3 sm:py-1 sm:text-xs">Admin · {etabNom}</span>
          </Link>
          <button onClick={signOutAndGoHome} className="btn-bf-outline shrink-0 text-sm"><LogOut className="h-4 w-4" />Déconnexion</button>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 sm:flex-row sm:px-6 sm:py-0">
          {[
            { k: "structure", l: "Filières & niveaux", i: <BookOpen className="h-4 w-4" /> },
            { k: "etudiants", l: "Étudiants", i: <Users className="h-4 w-4" /> },
            { k: "matieres", l: "Matières & notes", i: <GraduationCap className="h-4 w-4" /> },
            { k: "annonces", l: "Annonces", i: <Megaphone className="h-4 w-4" /> },
            { k: "evenements", l: "Événements", i: <Calendar className="h-4 w-4" /> },
            { k: "edt", l: "Emploi du temps", i: <Clock className="h-4 w-4" /> },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as never)}
              className={`inline-flex w-full items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition sm:w-auto sm:rounded-none sm:border-b-2 sm:py-3 ${tab === t.k ? "bg-primary-soft text-primary sm:bg-transparent sm:border-primary" : "text-muted-foreground hover:bg-muted/50 sm:border-transparent sm:hover:bg-transparent hover:text-foreground"}`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
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
      <div className="card-glass rounded-xl p-6">
        <h2 className="mb-3 font-bold">Filières</h2>
        <form onSubmit={addFil} className="mb-3 flex gap-2">
          <input value={nfil} onChange={(e) => setNfil(e.target.value)} placeholder="Nom de la filière"
            className="flex-1 rounded border border-input bg-surface px-3 py-2" />
          <button className="btn-bf-primary">Ajouter</button>
        </form>
        <ul className="space-y-2">
          {filieres.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
              <span>{f.nom}</span>
              <button onClick={() => delFil(f.id)} className="text-xs text-destructive underline">Suppr.</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-glass rounded-xl p-6">
        <h2 className="mb-3 font-bold">Niveaux</h2>
        <form onSubmit={addNiv} className="mb-3 space-y-2">
          <select value={nniv.filiere_id} onChange={(e) => setNniv({ ...nniv, filiere_id: e.target.value })}
            className="w-full rounded border border-input bg-surface px-3 py-2" required>
            <option value="">— Filière —</option>
            {filieres.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
          <div className="flex gap-2">
            <input value={nniv.nom} onChange={(e) => setNniv({ ...nniv, nom: e.target.value })} placeholder="Nom (ex: L1)"
              className="flex-1 rounded border border-input bg-surface px-3 py-2" />
            <input type="number" value={nniv.ordre} onChange={(e) => setNniv({ ...nniv, ordre: e.target.value })}
              className="w-20 rounded border border-input bg-surface px-3 py-2" />
            <button className="btn-bf-primary">Ajouter</button>
          </div>
        </form>
        <ul className="space-y-2">
          {filieres.map((f) => (
            <li key={f.id}>
              <div className="mb-1 text-xs font-bold text-muted-foreground">{f.nom}</div>
              <div className="space-y-1">
                {niveaux.filter((n) => n.filiere_id === f.id).map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
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
      className="w-full max-w-md rounded border border-input bg-surface px-3 py-2">
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
      <div className="card-glass rounded-xl p-6">
        <label className="mb-2 block text-sm">Niveau</label>
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card-glass rounded-xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Étudiants pré-inscrits ({list.length}) — {niv?.label}</h3>
              <label className="btn-bf-outline cursor-pointer text-sm">
                <Upload className="h-4 w-4" />Import CSV
                <input hidden type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = ""; }} />
              </label>
            </div>
            {msg && <div className="mb-3 rounded bg-primary-soft p-2 text-sm text-primary">{msg}</div>}
            <div className="space-y-1">
              {list.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
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

          <form onSubmit={add} className="card-glass space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Ajouter un étudiant</h3>
            <SmInput label="Nom complet" v={form.nom_complet} on={(v) => setForm({ ...form, nom_complet: v })} />
            <SmInput label="Email" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} />
            <SmInput label="Date de naissance" type="date" v={form.date_naissance} on={(v) => setForm({ ...form, date_naissance: v })} />
            <button className="btn-bf-primary w-full">Ajouter</button>
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
  const [matieres, setMatieres] = useState<{ id: string; nom: string; coefficient: number }[]>([]);
  const [nMat, setNMat] = useState({ nom: "", coefficient: "1" });
  const [selMat, setSelMat] = useState<string>("");
  const [notes, setNotes] = useState<{ id: string; etudiant_user_id: string; valeur: number; type_evaluation: string; commentaire: string | null }[]>([]);
  const [etudiants, setEtudiants] = useState<{ user_id: string; nom_complet: string; email: string }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!niveauId) { setMatieres([]); setEtudiants([]); return; }
    supabase.from("matieres").select("id,nom,coefficient").eq("niveau_id", niveauId).order("nom")
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
    await supabase.from("matieres").insert({ niveau_id: niveauId, nom: nMat.nom.trim(), coefficient: Number(nMat.coefficient) || 1 });
    setNMat({ nom: "", coefficient: "1" });
    const { data } = await supabase.from("matieres").select("id,nom,coefficient").eq("niveau_id", niveauId).order("nom");
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
      <div className="card-glass rounded-xl p-6">
        <label className="mb-2 block text-sm">Niveau</label>
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>

      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card-glass rounded-xl p-6">
            <h3 className="mb-3 font-bold">Matières</h3>
            <form onSubmit={addMat} className="mb-3 flex gap-2">
              <input value={nMat.nom} onChange={(e) => setNMat({ ...nMat, nom: e.target.value })} placeholder="Nom"
                className="flex-1 rounded border border-input bg-surface px-3 py-2" />
              <input type="number" step="0.1" value={nMat.coefficient} onChange={(e) => setNMat({ ...nMat, coefficient: e.target.value })}
                className="w-20 rounded border border-input bg-surface px-3 py-2" title="Coefficient" />
              <button className="btn-bf-primary">+</button>
            </form>
            <ul className="space-y-1">
              {matieres.map((m) => (
                <li key={m.id}>
                  <button onClick={() => setSelMat(m.id)}
                    className={`w-full rounded border p-2 text-left text-sm ${selMat === m.id ? "border-primary bg-primary-soft" : "border-border bg-surface"}`}>
                    <span className="font-semibold">{m.nom}</span> <span className="text-xs text-muted-foreground">· coef {m.coefficient}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-glass rounded-xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Notes {selMat ? `(${notes.length})` : ""}</h3>
              {selMat && (
                <label className="btn-bf-outline cursor-pointer text-sm">
                  <Upload className="h-4 w-4" />Import CSV
                  <input hidden type="file" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importNotes(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {msg && <div className="mb-3 rounded bg-primary-soft p-2 text-sm text-primary">{msg}</div>}
            {!selMat && <p className="text-sm text-muted-foreground">Sélectionnez une matière.</p>}
            {selMat && (
              <div className="space-y-1">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
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
  const [list, setList] = useState<{ id: string; titre: string; contenu: string; created_at: string }[]>([]);
  const [form, setForm] = useState({ titre: "", contenu: "" });

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("annonces").select("id,titre,contenu,created_at").eq("niveau_id", niveauId).order("created_at", { ascending: false });
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!niveauId) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("annonces").insert({ niveau_id: niveauId, titre: form.titre.trim(), contenu: form.contenu.trim(), created_by: u.user?.id });
    setForm({ titre: "", contenu: "" }); load();
  }
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-xl p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="card-glass rounded-xl p-6">
            <h3 className="mb-3 font-bold">Annonces ({list.length})</h3>
            <div className="space-y-3">
              {list.map((a) => (
                <article key={a.id} className="rounded border border-border bg-surface p-4">
                  <div className="flex justify-between">
                    <h4 className="font-semibold">{a.titre}</h4>
                    <button onClick={async () => { await supabase.from("annonces").delete().eq("id", a.id); load(); }}
                      className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.contenu}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
                </article>
              ))}
              {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune annonce.</p>}
            </div>
          </div>
          <form onSubmit={add} className="card-glass space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Nouvelle annonce</h3>
            <SmInput label="Titre" v={form.titre} on={(v) => setForm({ ...form, titre: v })} />
            <div>
              <label className="mb-1 block text-sm">Contenu</label>
              <textarea required rows={5} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                className="w-full rounded border border-input bg-surface px-3 py-2" />
            </div>
            <button className="btn-bf-primary w-full">Publier</button>
          </form>
        </div>
      )}
    </div>
  );
}

// -------------- Événements --------------
function EvenementsPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<{ id: string; titre: string; description: string | null; date_evenement: string; lieu: string | null }[]>([]);
  const [form, setForm] = useState({ titre: "", description: "", date_evenement: "", lieu: "" });

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("evenements").select("*").eq("niveau_id", niveauId).order("date_evenement");
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!niveauId) return;
    await supabase.from("evenements").insert({
      niveau_id: niveauId, titre: form.titre.trim(), description: form.description.trim() || null,
      date_evenement: form.date_evenement, lieu: form.lieu.trim() || null,
    });
    setForm({ titre: "", description: "", date_evenement: "", lieu: "" }); load();
  }
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-xl p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="card-glass rounded-xl p-6">
            <h3 className="mb-3 font-bold">Événements ({list.length})</h3>
            <div className="space-y-2">
              {list.map((e) => (
                <div key={e.id} className="rounded border border-border bg-surface p-3">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{e.titre}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(e.date_evenement).toLocaleString("fr-FR")}{e.lieu ? ` · ${e.lieu}` : ""}</p>
                      {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                    </div>
                    <button onClick={async () => { await supabase.from("evenements").delete().eq("id", e.id); load(); }}
                      className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
            </div>
          </div>
          <form onSubmit={add} className="card-glass space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Nouvel événement</h3>
            <SmInput label="Titre" v={form.titre} on={(v) => setForm({ ...form, titre: v })} />
            <SmInput label="Date & heure" type="datetime-local" v={form.date_evenement} on={(v) => setForm({ ...form, date_evenement: v })} />
            <SmInput label="Lieu" v={form.lieu} on={(v) => setForm({ ...form, lieu: v })} />
            <div>
              <label className="mb-1 block text-sm">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded border border-input bg-surface px-3 py-2" />
            </div>
            <button className="btn-bf-primary w-full">Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
}

// -------------- Emploi du temps --------------
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
function EDTPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<{ id: string; jour_semaine: number; heure_debut: string; heure_fin: string; matiere: string; salle: string | null; enseignant: string | null }[]>([]);
  const [form, setForm] = useState({ jour_semaine: "1", heure_debut: "08:00", heure_fin: "10:00", matiere: "", salle: "", enseignant: "" });

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("emplois_du_temps").select("*").eq("niveau_id", niveauId).order("jour_semaine").order("heure_debut");
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!niveauId) return;
    await supabase.from("emplois_du_temps").insert({
      niveau_id: niveauId, jour_semaine: Number(form.jour_semaine),
      heure_debut: form.heure_debut, heure_fin: form.heure_fin,
      matiere: form.matiere.trim(), salle: form.salle.trim() || null, enseignant: form.enseignant.trim() || null,
    });
    setForm({ ...form, matiere: "", salle: "", enseignant: "" }); load();
  }
  return (
    <div className="space-y-6">
      <div className="card-glass rounded-xl p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="card-glass rounded-xl p-6">
            <h3 className="mb-3 font-bold">Emploi du temps</h3>
            {JOURS.map((j, i) => {
              const items = list.filter((x) => x.jour_semaine === i + 1);
              if (!items.length) return null;
              return (
                <div key={j} className="mb-4">
                  <h4 className="mb-1 text-sm font-bold text-primary">{j}</h4>
                  <div className="space-y-1">
                    {items.map((x) => (
                      <div key={x.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
                        <span>{x.heure_debut.slice(0, 5)}–{x.heure_fin.slice(0, 5)} · <strong>{x.matiere}</strong>{x.salle ? ` · ${x.salle}` : ""}{x.enseignant ? ` · ${x.enseignant}` : ""}</span>
                        <button onClick={async () => { await supabase.from("emplois_du_temps").delete().eq("id", x.id); load(); }}
                          className="text-xs text-destructive underline">Suppr.</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun créneau.</p>}
          </div>
          <form onSubmit={add} className="card-glass space-y-3 rounded-xl p-6">
            <h3 className="font-bold">Ajouter un créneau</h3>
            <div>
              <label className="mb-1 block text-sm">Jour</label>
              <select value={form.jour_semaine} onChange={(e) => setForm({ ...form, jour_semaine: e.target.value })}
                className="w-full rounded border border-input bg-surface px-3 py-2">
                {JOURS.map((j, i) => <option key={j} value={i + 1}>{j}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SmInput label="Début" type="time" v={form.heure_debut} on={(v) => setForm({ ...form, heure_debut: v })} />
              <SmInput label="Fin" type="time" v={form.heure_fin} on={(v) => setForm({ ...form, heure_fin: v })} />
            </div>
            <SmInput label="Matière" v={form.matiere} on={(v) => setForm({ ...form, matiere: v })} />
            <SmInput label="Salle" v={form.salle} on={(v) => setForm({ ...form, salle: v })} />
            <SmInput label="Enseignant" v={form.enseignant} on={(v) => setForm({ ...form, enseignant: v })} />
            <button className="btn-bf-primary w-full">Ajouter</button>
          </form>
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
        className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary" />
    </div>
  );
}
