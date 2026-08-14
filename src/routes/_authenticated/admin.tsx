import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";

import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, GraduationCap, BookOpen, Users, Megaphone, Calendar, Clock, Upload, Menu, X, Heart, ImagePlus, Plus, History, Trash2 } from "lucide-react";
import { BLOCS, JOURS, JOURS_LONGS, coursOf, hhmm, type Bloc, type Cours } from "@/lib/edt";
import { appreciation } from "@/lib/notes";
import { afficheUrls, AFFICHES_BUCKET } from "@/lib/affiches";
import { parseExcelEtudiants, type ChampsOptionnels } from "@/lib/excel";

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
  const [tab, setTab] = useState<"structure" | "etudiants" | "matieres" | "annonces" | "evenements" | "edt" | "historique" | "corbeille">("structure");

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
    { k: "historique", l: "Historique", i: History, c: "icon-green" },
    { k: "corbeille", l: "Corbeille", i: Trash2, c: "text-destructive" },
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
        {tab === "historique" && <HistoriquePanel etabId={etabId} />}
        {tab === "corbeille" && <CorbeillePanel etabId={etabId} />}
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
  const [filASupprimer, setFilASupprimer] = useState<Filiere | null>(null);

  async function load() {
    const { data: f } = await supabase.from("filieres").select("id,nom").eq("etablissement_id", etabId).is("deleted_at", null).order("nom");
    setFilieres((f as Filiere[]) ?? []);
    const ids = (f ?? []).map((x) => x.id);
    if (ids.length) {
      const { data: n } = await supabase.from("niveaux").select("id,nom,ordre,filiere_id").in("filiere_id", ids).is("deleted_at", null).order("ordre");
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
  async function confirmerDelFil() {
    if (!filASupprimer) return;
    const f = filASupprimer;
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "filieres",
      _record_id: f.id,
      _description: `Mise en corbeille de la filière "${f.nom}"`,
      _ancienne_valeur: f,
      _nouvelle_valeur: null,
    });
    await supabase.from("filieres").update({ deleted_at: new Date().toISOString() }).eq("id", f.id);
    setFilASupprimer(null);
    load();
  }
  async function addNiv(e: React.FormEvent) {
    e.preventDefault();
    if (!nniv.filiere_id || !nniv.nom.trim()) return;
    await supabase.from("niveaux").insert({ filiere_id: nniv.filiere_id, nom: nniv.nom.trim(), ordre: Number(nniv.ordre) || 1 });
    setNniv({ filiere_id: nniv.filiere_id, nom: "", ordre: "1" }); load();
  }
  const [nivASupprimer, setNivASupprimer] = useState<Niveau | null>(null);
  async function confirmerDelNiv() {
    if (!nivASupprimer) return;
    const n = nivASupprimer;
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "niveaux",
      _record_id: n.id,
      _description: `Mise en corbeille du niveau "${n.nom}"`,
      _ancienne_valeur: n,
      _nouvelle_valeur: null,
    });
    await supabase.from("niveaux").update({ deleted_at: new Date().toISOString() }).eq("id", n.id);
    setNivASupprimer(null);
    load();
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
              <button onClick={() => setFilASupprimer(f)} className="text-xs text-destructive underline">Suppr.</button>
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
                    <button onClick={() => setNivASupprimer(n)} className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {filASupprimer && (
        <ConfirmationSaisie
          titre="Supprimer cette filière ?"
          message={`Cette action supprimera définitivement la filière et tous ses niveaux. Cette action est irréversible.`}
          motAttendu={filASupprimer.nom}
          onConfirm={confirmerDelFil}
          onCancel={() => setFilASupprimer(null)}
        />
      )}
      {nivASupprimer && (
        <ConfirmationSaisie
          titre="Supprimer ce niveau ?"
          message={`Ce niveau sera déplacé vers la corbeille : "${nivASupprimer.nom}".`}
          motAttendu={nivASupprimer.nom}
          onConfirm={confirmerDelNiv}
          onCancel={() => setNivASupprimer(null)}
        />
      )}
    </div>
  );
}

// -------------- Sélecteur niveau partagé --------------
function useNiveauxOfEtab(etabId: string) {
  const [items, setItems] = useState<{ niveau_id: string; label: string }[]>([]);
  useEffect(() => {
    (async () => {
      const { data: fil } = await supabase.from("filieres").select("id,nom").eq("etablissement_id", etabId).is("deleted_at", null).order("nom");
      const ids = (fil ?? []).map((f) => f.id);
      if (!ids.length) { setItems([]); return; }
      const { data: niv } = await supabase.from("niveaux").select("id,nom,ordre,filiere_id").in("filiere_id", ids).is("deleted_at", null).order("ordre");
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
  const [list, setList] = useState<{ id: string; nom_complet: string; email: string; date_naissance: string; inscrit: boolean; matricule?: string | null; telephone?: string | null }[]>([]);
  const [form, setForm] = useState({ nom_complet: "", email: "", date_naissance: "", matricule: "", telephone: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [etuASupprimer, setEtuASupprimer] = useState<typeof list[0] | null>(null);
  const [confirmerToutSupprimer, setConfirmerToutSupprimer] = useState(false);
  const [config, setConfig] = useState<ChampsOptionnels>({ matricule: false, telephone: false });
  const [showImportExcel, setShowImportExcel] = useState(false);
  const niv = useMemo(() => niveaux.find((n) => n.niveau_id === niveauId), [niveaux, niveauId]);

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("etudiants_pre_inscrits").select("id,nom_complet,email,date_naissance,inscrit,matricule,telephone")
      .eq("niveau_id", niveauId).is("deleted_at", null).order("nom_complet");
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("etablissement_champs_optionnels")
        .select("utilise_matricule,utilise_telephone").eq("etablissement_id", etabId).maybeSingle();
      setConfig({ matricule: data?.utilise_matricule ?? false, telephone: data?.utilise_telephone ?? false });
    })();
  }, [etabId]);

  async function sauverConfig(next: ChampsOptionnels) {
    setConfig(next);
    await supabase.from("etablissement_champs_optionnels").upsert({
      etablissement_id: etabId, utilise_matricule: next.matricule, utilise_telephone: next.telephone,
    });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!niveauId) return;
    const { data: n } = await supabase.from("niveaux").select("filiere_id").eq("id", niveauId).maybeSingle();
    if (!n) return;
    const { error } = await supabase.from("etudiants_pre_inscrits").insert({
      etablissement_id: etabId, filiere_id: n.filiere_id, niveau_id: niveauId,
      nom_complet: form.nom_complet.trim(), email: form.email.trim().toLowerCase(), date_naissance: form.date_naissance,
      matricule: config.matricule ? (form.matricule.trim() || null) : null,
      telephone: config.telephone ? (form.telephone.trim() || null) : null,
    });
    if (error) { setMsg(error.message); return; }
    setForm({ nom_complet: "", email: "", date_naissance: "", matricule: "", telephone: "" }); load();
  }

  async function importExcel(file: File) {
    setMsg(null);
    if (!niveauId) { setMsg("Sélectionnez un niveau"); return; }
    setBusy(true);
    try {
      const { valides, rejetees } = await parseExcelEtudiants(file, config);
      if (valides.length === 0) {
        throw new Error(rejetees.length > 0 ? `Aucune ligne valide (${rejetees.length} rejetée(s)). Vérifiez les colonnes du fichier.` : "Fichier vide ou illisible.");
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée. Reconnectez-vous.");
      const res = await fetch("/api/admin/import-excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ niveauId, lignes: valides }),
      });
      const json = await res.json().catch(() => ({ error: "Échec de l'import Excel" }));
      if (!res.ok) throw new Error(json.message || json.error || "Échec de l'import Excel");
      const suffixe = rejetees.length > 0 ? ` — ${rejetees.length} ligne(s) ignorée(s) (voir détails ci-dessous)` : "";
      setMsg(`${json.imported} étudiant(s) importé(s)${suffixe}`);
      if (rejetees.length > 0) {
        console.warn("Lignes rejetées à l'import Excel :", rejetees);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec de l'import Excel");
    } finally {
      setBusy(false);
      load();
    }
  }

  async function confirmerSuppressionTotale() {
    if (!niveauId || !list.length) {
      setConfirmerToutSupprimer(false);
      return;
    }

    try {
      setBusy(true);
      const ids = list.map((e) => e.id);
      const now = new Date().toISOString();

      await supabase.rpc("enregistrer_audit", {
        _etablissement_id: etabId,
        _action: "suppression",
        _table_name: "etudiants_pre_inscrits",
        _record_id: null,
        _description: `Mise en corbeille de tous les étudiants (${ids.length}) du niveau "${niv?.label ?? ""}"`,
        _ancienne_valeur: JSON.stringify({ count: ids.length, niveau_id: niveauId }),
        _nouvelle_valeur: null,
      });

      const { error } = await supabase
        .from("etudiants_pre_inscrits")
        .update({ deleted_at: now })
        .eq("niveau_id", niveauId)
        .is("deleted_at", null);

      if (error) throw error;

      setMsg(`${ids.length} étudiant(s) déplacé(s) vers la corbeille.`);
    } catch (err: any) {
      setMsg(`Erreur lors de la suppression : ${err.message || "Échec de l'opération"}`);
    } finally {
      setBusy(false);
      setConfirmerToutSupprimer(false);
      load();
    }
  }

  async function confirmerDel() {
    if (!etuASupprimer) return;
    const etu = etuASupprimer;
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "etudiants_pre_inscrits",
      _record_id: etu.id,
      _description: `Mise en corbeille de l'étudiant "${etu.nom_complet}"`,
      _ancienne_valeur: etu,
      _nouvelle_valeur: null,
    });
    await supabase.from("etudiants_pre_inscrits").update({ deleted_at: new Date().toISOString() }).eq("id", etu.id);
    setEtuASupprimer(null);
    load();
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Étudiants pré-inscrits ({list.length}) — {niv?.label}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowImportExcel((v) => !v)} className="btn-bf-outline text-sm">
                  <Upload className="icon-tinted h-4 w-4" />Import Excel
                </button>
                {list.length > 0 && (
                  <button onClick={() => setConfirmerToutSupprimer(true)} className="text-xs text-destructive underline">
                    Supprimer tout
                  </button>
                )}
              </div>
            </div>

            {showImportExcel && (
              <div className="mb-4 rounded-xl border border-border bg-surface p-4 space-y-3">
                <h4 className="text-sm font-bold">Import Excel (.xlsx)</h4>
                <p className="text-xs text-muted-foreground">
                  Colonnes obligatoires reconnues automatiquement : nom complet (ou nom + prénom séparés), email, date de naissance (tout format accepté).
                </p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={config.matricule} onChange={(e) => sauverConfig({ ...config, matricule: e.target.checked })} />
                    Fichier avec matricule
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={config.telephone} onChange={(e) => sauverConfig({ ...config, telephone: e.target.checked })} />
                    Fichier avec téléphone
                  </label>
                </div>
                <label className="btn-forest inline-block cursor-pointer text-sm">
                  Choisir le fichier Excel
                  <input hidden type="file" accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) importExcel(f); e.target.value = ""; }} />
                </label>
                {busy && <p className="text-xs text-muted-foreground">Import en cours…</p>}
              </div>
            )}

            {msg && <div className="mb-3 rounded bg-primary-soft p-2 text-sm text-primary">{msg}</div>}
            <div className="space-y-2">
              {list.map((e) => (
                <div key={e.id} className="rounded-xl border border-border bg-surface p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="font-semibold leading-tight">{e.nom_complet}</h4>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${e.inscrit ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
                      {e.inscrit ? "✓ Inscrit" : "En attente"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="text-muted-foreground">Email</div>
                    <div className="truncate text-right">{e.email}</div>
                    <div className="text-muted-foreground">Naissance</div>
                    <div className="text-right">{e.date_naissance}</div>
                    {config.matricule && e.matricule && (
                      <>
                        <div className="text-muted-foreground">Matricule</div>
                        <div className="text-right">{e.matricule}</div>
                      </>
                    )}
                    {config.telephone && e.telephone && (
                      <>
                        <div className="text-muted-foreground">Téléphone</div>
                        <div className="text-right">{e.telephone}</div>
                      </>
                    )}
                  </div>
                  <button onClick={() => setEtuASupprimer(e)} className="mt-2 text-xs text-destructive underline">Supprimer</button>
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
            {config.matricule && <SmInput label="Matricule" v={form.matricule} on={(v) => setForm({ ...form, matricule: v })} />}
            {config.telephone && <SmInput label="Téléphone" v={form.telephone} on={(v) => setForm({ ...form, telephone: v })} />}
            <button className="btn-forest w-full">Ajouter</button>
          </form>
        </div>
      )}
      {etuASupprimer && (
        <ConfirmationSaisie
          titre="Supprimer cet étudiant ?"
          message={`Cet étudiant sera déplacé vers la corbeille : "${etuASupprimer.nom_complet}".`}
          motAttendu="SUPPRIMER"
          onConfirm={confirmerDel}
          onCancel={() => setEtuASupprimer(null)}
        />
      )}
      {confirmerToutSupprimer && (
        <ConfirmationSaisie
          titre="Supprimer tous les étudiants ?"
          message={`Tous les étudiants de "${niv?.label ?? ""}" (${list.length}) seront déplacés vers la corbeille.`}
          motAttendu="SUPPRIMER TOUT"
          onConfirm={confirmerSuppressionTotale}
          onCancel={() => setConfirmerToutSupprimer(false)}
        />
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
      supabase.from("matieres").select("id,nom,credits").eq("niveau_id", niveauId).is("deleted_at", null).order("nom"),
      supabase.from("etudiants_pre_inscrits").select("user_id,nom_complet,email").eq("niveau_id", niveauId).eq("inscrit", true).is("deleted_at", null),
    ]).then(([{ data: mats }, { data: etus }]) => {
      setMatieres((mats as never) ?? []);
      setEtudiants(((etus ?? []).filter((e) => e.user_id)) as never);
    });
  }, [niveauId]);

  useEffect(() => {
    if (!selMat) { setNotes([]); return; }
    supabase.from("notes").select("id,etudiant_user_id,valeur,type_evaluation,commentaire").eq("matiere_id", selMat).is("deleted_at", null)
      .then(({ data }) => setNotes((data as never) ?? []));
  }, [selMat]);

  async function addMat(e: React.FormEvent) {
    e.preventDefault();
    if (!niveauId || !nMat.nom.trim()) return;
    await supabase.from("matieres").insert({ niveau_id: niveauId, nom: nMat.nom.trim(), credits: Number(nMat.credits) || 0 });
    setNMat({ nom: "", credits: "1" });
    const { data } = await supabase.from("matieres").select("id,nom,credits").eq("niveau_id", niveauId).is("deleted_at", null).order("nom");
    setMatieres((data as never) ?? []);
  }

  const noteOf = (uid: string) => notes.find((n) => n.etudiant_user_id === uid);

  async function reloadNotes() {
    if (!selMat) return;
    const { data } = await supabase.from("notes").select("id,etudiant_user_id,valeur,type_evaluation,commentaire").eq("matiere_id", selMat).is("deleted_at", null);
    setNotes((data as never) ?? []);
  }

  /** Enregistre (crée ou met à jour) la note d'un étudiant pour la matière sélectionnée. */
  async function saveNote(uid: string): Promise<string | null> {
    const raw = saisie[uid];
    if (raw === undefined || raw.trim() === "") return null;
    const val = Number(raw.replace(",", "."));
    if (Number.isNaN(val) || val < 0 || val > 20) return "Note invalide (0 à 20)";
    const existing = noteOf(uid);
    const payload = { valeur: val, commentaire: appreciation(val) };
    if (existing) {
      if (existing.valeur !== val) {
        const etu = etudiants.find((x) => x.user_id === uid);
        await supabase.rpc("enregistrer_audit", {
          _etablissement_id: etabId,
          _action: "modification",
          _table_name: "notes",
          _record_id: existing.id,
          _description: `Modification de la note de "${etu?.nom_complet ?? uid}" : ${existing.valeur} → ${val}`,
          _ancienne_valeur: existing,
          _nouvelle_valeur: payload,
        });
      }
      const { error } = await supabase.from("notes").update(payload).eq("id", existing.id);
      return error?.message ?? null;
    }
    const { error } = await supabase.from("notes").insert({
      etudiant_user_id: uid, matiere_id: selMat, type_evaluation: "evaluation", ...payload,
    });
    return error?.message ?? null;
  }

  async function saveOne(uid: string) {
    setSaving(true); setMsg(null);
    const err = await saveNote(uid);
    await reloadNotes();
    setMsg(err ?? "Note enregistrée.");
    setSaving(false);
  }

  async function saveAll() {
    setSaving(true); setMsg(null);
    let n = 0; let firstErr: string | null = null;
    for (const e of etudiants) {
      const before = saisie[e.user_id];
      if (before === undefined || before.trim() === "") continue;
      const err = await saveNote(e.user_id);
      if (err) firstErr ??= err; else n++;
    }
    await reloadNotes();
    setMsg(firstErr ?? `${n} note(s) enregistrée(s).`);
    setSaving(false);
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="card-soft p-6">
        <label className="mb-2 block text-sm">Niveau</label>
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>

      {niveauId && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <div className="card-soft min-w-0 p-6">
            <h3 className="mb-3 font-bold">Matières</h3>
            <form onSubmit={addMat} className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_auto]">
              <input value={nMat.nom} onChange={(e) => setNMat({ ...nMat, nom: e.target.value })} placeholder="Nom"
                className="input-soft col-span-2 min-w-0 sm:col-span-1" />
              <input type="number" min="0" step="1" value={nMat.credits} onChange={(e) => setNMat({ ...nMat, credits: e.target.value })}
                className="input-soft min-w-0" title="Crédits" placeholder="Crédits" />
              <button className="btn-forest col-span-2 sm:col-span-1">Ajouter</button>
            </form>
            <ul className="space-y-1">
              {matieres.map((m) => (
                <li key={m.id}>
                  <button onClick={() => { setSelMat(m.id); setSaisie({}); setMsg(null); }}
                    className={`w-full rounded-[10px] border p-2 text-left text-sm transition ${selMat === m.id ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-muted"}`}>
                    <span className="font-semibold">{m.nom}</span>{" "}
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{m.credits} crédit{m.credits > 1 ? "s" : ""}</span>
                  </button>
                </li>
              ))}
              {matieres.length === 0 && <p className="text-sm text-muted-foreground">Aucune matière.</p>}
            </ul>
          </div>

          <div className="card-soft min-w-0 p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Saisie des notes</h3>
              {matieres.length > 0 && selMat && etudiants.length > 0 && (
                <button onClick={saveAll} disabled={saving} className="btn-forest">Enregistrer toutes les notes</button>
              )}
            </div>
            {msg && <div className="mb-3 rounded-[10px] bg-primary-soft p-2 text-sm text-primary">{msg}</div>}
            {matieres.length === 0 && <p className="text-sm text-muted-foreground">Créez d'abord une matière pour saisir des notes.</p>}
            {matieres.length > 0 && !selMat && <p className="text-sm text-muted-foreground">Sélectionnez une matière.</p>}
            {matieres.length > 0 && selMat && etudiants.length === 0 && <p className="text-sm text-muted-foreground">Aucun étudiant inscrit pour ce niveau.</p>}
            {matieres.length > 0 && selMat && etudiants.length > 0 && (
              <div className="space-y-2">
                {etudiants.map((e) => {
                  const existing = noteOf(e.user_id);
                  const value = saisie[e.user_id] ?? (existing ? String(existing.valeur) : "");
                  const num = Number(String(value).replace(",", "."));
                  const appr = value !== "" && !Number.isNaN(num) ? appreciation(num) : null;
                  return (
                    <div key={e.user_id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[10px] border border-border bg-surface p-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{e.nom_complet}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.email}{appr ? ` · ${appr}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <input type="number" min="0" max="20" step="0.25" value={value} placeholder="/20"
                          onChange={(ev) => setSaisie({ ...saisie, [e.user_id]: ev.target.value })}
                          className="input-soft w-20" />
                        <button onClick={() => saveOne(e.user_id)} disabled={saving} className="btn-forest">OK</button>
                        {existing && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Supprimer la note de "${e.nom_complet}" ?`)) return;
                              await supabase.rpc("enregistrer_audit", {
                                _etablissement_id: etabId,
                                _action: "suppression",
                                _table_name: "notes",
                                _record_id: existing.id,
                                _description: `Mise en corbeille de la note de "${e.nom_complet}"`,
                                _ancienne_valeur: existing,
                                _nouvelle_valeur: null,
                              });
                              await supabase.from("notes").update({ deleted_at: new Date().toISOString() }).eq("id", existing.id); setSaisie({ ...saisie, [e.user_id]: "" }); await reloadNotes();
                            }}
                            className="text-xs text-destructive underline">Suppr.</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <p className="mt-2 text-xs text-muted-foreground">
                  L'appréciation est générée automatiquement selon le barème (0–5 Très insuffisant … 18–20 Excellent).
                </p>
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
                    <button onClick={async () => {
                      await supabase.rpc("enregistrer_audit", {
                        _etablissement_id: etabId,
                        _action: "suppression",
                        _table_name: "annonces",
                        _record_id: a.id,
                        _description: `Suppression de l'annonce "${a.titre}"`,
                        _ancienne_valeur: a,
                        _nouvelle_valeur: null,
                      });
                      await supabase.from("annonces").delete().eq("id", a.id); load();
                    }}
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
    {/* <label className="flex items-center gap-1.5">
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
                    )} */}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
                  {/*{a.comments_enabled && <AdminComments annonceId={a.id} />}*/}
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
            {/* <label className="flex items-center gap-2 text-sm">
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
            )} */}
            <button className="btn-forest w-full">Publier</button>
          </form>
        </div>
      )}
    </div>
  );
}

function AdminComments({ annonceId }: { annonceId: string }) {
  const [list, setList] = useState<{ id: string; content: string; created_at: string; user_id: string; author_name: string | null }[]>([]);

  async function load() {
    const { data } = await supabase.rpc("get_announcement_comments", { p_announcement_id: annonceId });
    setList((data as never as typeof list) ?? []);
  }
  useEffect(() => { load(); }, [annonceId]);

  if (!list.length) return <p className="mt-2 text-xs text-muted-foreground">Aucun commentaire.</p>;
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {list.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
          <div>
            <span className="font-medium">{c.author_name ?? "Étudiant"}</span>{" "}
            <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
            <p className="whitespace-pre-wrap">{c.content}</p>
          </div>
          <button
            onClick={async () => {
              await supabase.rpc("enregistrer_audit", {
                _etablissement_id: null,
                _action: "suppression",
                _table_name: "announcement_comments",
                _record_id: c.id,
                _description: `Suppression du commentaire de "${c.author_name ?? "Étudiant"}"`,
                _ancienne_valeur: c,
                _nouvelle_valeur: null,
              });
              await supabase.from("announcement_comments").delete().eq("id", c.id); load();
            }}
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
                      <button onClick={async () => {
                        await supabase.rpc("enregistrer_audit", {
                          _etablissement_id: etabId,
                          _action: "suppression",
                          _table_name: "evenements",
                          _record_id: e.id,
                          _description: `Suppression de l'événement "${e.titre}"`,
                          _ancienne_valeur: e,
                          _nouvelle_valeur: null,
                        });
                        await supabase.from("evenements").delete().eq("id", e.id); load();
                      }}
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

                  // -------------- Emploi du temps (jours × blocs matin / après-midi) --------------
function EDTPanel({ etabId }: { etabId: string }) {
  const niveaux = useNiveauxOfEtab(etabId);
  const [niveauId, setNiveauId] = useState("");
  const [list, setList] = useState<Cours[]>([]);
  const [cell, setCell] = useState<{ jour: number; bloc: Bloc } | null>(null);
  const [form, setForm] = useState({ heure_debut: "", heure_fin: "", matiere: "", professeur: "", salle: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!niveauId) { setList([]); return; }
    const { data } = await supabase.from("cours_emploi_temps").select("*").eq("niveau_id", niveauId)
      .order("jour_semaine").order("heure_debut");
    setList((data as never) ?? []);
  }
  useEffect(() => { load(); }, [niveauId]);

  function openAdd(jour: number, bloc: Bloc) {
    const b = BLOCS.find((x) => x.key === bloc)!;
    setEditId(null);
    setCell({ jour, bloc });
    setForm({ heure_debut: b.defaultDebut, heure_fin: b.defaultFin, matiere: "", professeur: "", salle: "" });
  }

  function openEdit(c: Cours) {
    setEditId(c.id);
    setCell({ jour: c.jour_semaine, bloc: c.bloc });
    setForm({
      heure_debut: hhmm(c.heure_debut), heure_fin: hhmm(c.heure_fin),
      matiere: c.matiere, professeur: c.professeur ?? "", salle: c.salle ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!niveauId || !cell || !form.matiere.trim() || busy) return;
    setBusy(true);
    const payload = {
      niveau_id: niveauId, jour_semaine: cell.jour, bloc: cell.bloc,
      heure_debut: form.heure_debut, heure_fin: form.heure_fin,
      matiere: form.matiere.trim(), professeur: form.professeur.trim() || null, salle: form.salle.trim() || null,
    };
    if (editId) await supabase.from("cours_emploi_temps").update(payload).eq("id", editId);
    else await supabase.from("cours_emploi_temps").insert(payload);
    setCell(null); setEditId(null);
    await load();
    setBusy(false);
  }

  async function del(id: string) {
    const cours = list.find((x) => x.id === id);
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression",
      _table_name: "cours_emploi_temps",
      _record_id: id,
      _description: `Suppression du cours "${cours?.matiere ?? id}"`,
      _ancienne_valeur: cours ?? null,
      _nouvelle_valeur: null,
    });
    await supabase.from("cours_emploi_temps").delete().eq("id", id);
    if (editId === id) { setCell(null); setEditId(null); }
    await load();
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="card-soft p-6">
        <NiveauPicker items={niveaux} value={niveauId} onChange={setNiveauId} />
      </div>
      {niveauId && (
        <div className="card-soft min-w-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
            <Clock className="icon-teal h-5 w-5" />
            <h3 className="font-bold">Emploi du temps</h3>
            <span className="text-xs text-muted-foreground">Matin et après-midi — plusieurs cours possibles par bloc</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-28 border-b border-border p-2 text-left font-medium text-muted-foreground">Bloc</th>
                  {JOURS.map((j) => (
                    <th key={j} className="border-b border-l border-border p-2 font-semibold">{JOURS_LONGS[j - 1]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOCS.map((b) => (
                  <tr key={b.key}>
                    <td className="border-b border-border p-2 align-top">
                      <p className="font-semibold">{b.label}</p>
                    </td>
                    {JOURS.map((j) => (
                      <td key={j} className="border-b border-l border-border p-1.5 align-top">
                        <div className="space-y-1.5">
                          {coursOf(list, j, b.key).map((c) => (
                            <div key={c.id} className="rounded-[10px] bg-primary-soft p-2 leading-tight">
                              <p className="font-mono text-[10px] text-muted-foreground">{hhmm(c.heure_debut)}–{hhmm(c.heure_fin)}</p>
                              <p className="font-semibold text-primary">{c.matiere}</p>
                              {c.professeur && <p className="text-[11px] text-muted-foreground">{c.professeur}</p>}
                              {c.salle && <p className="text-[11px] text-muted-foreground">{c.salle}</p>}
                              <div className="mt-1 flex gap-2">
                                <button onClick={() => openEdit(c)} className="text-[10px] text-primary underline">Modifier</button>
                                <button onClick={() => del(c.id)} className="text-[10px] text-destructive underline">Suppr.</button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => openAdd(j, b.key)}
                            className="flex w-full items-center justify-center gap-1 rounded-[8px] border border-dashed border-border py-1.5 text-[11px] text-muted-foreground transition hover:bg-muted">
                            <Plus className="h-3 w-3" />Ajouter un cours
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cell && (
            <form onSubmit={save} className="grid gap-3 border-t border-border p-5 sm:grid-cols-3 lg:grid-cols-6">
              <div className="text-sm font-semibold text-primary sm:col-span-3 lg:col-span-6">
                {JOURS_LONGS[cell.jour - 1]} · {BLOCS.find((b) => b.key === cell.bloc)?.label} {editId ? "· modification" : ""}
              </div>
              <SmInput label="Heure de début" type="time" v={form.heure_debut} on={(v) => setForm({ ...form, heure_debut: v })} />
              <SmInput label="Heure de fin" type="time" v={form.heure_fin} on={(v) => setForm({ ...form, heure_fin: v })} />
              <SmInput label="Matière" v={form.matiere} on={(v) => setForm({ ...form, matiere: v })} />
              <SmInput label="Professeur" v={form.professeur} on={(v) => setForm({ ...form, professeur: v })} />
              <SmInput label="Salle" v={form.salle} on={(v) => setForm({ ...form, salle: v })} />
              <div className="flex items-end gap-2">
                <button className="btn-forest flex-1" disabled={busy}>{editId ? "Enregistrer" : "Ajouter"}</button>
                <button type="button" onClick={() => { setCell(null); setEditId(null); }} className="btn-bf-outline">Annuler</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// -------------- Corbeille (centralisée) --------------
type ItemCorbeille = { id: string; label: string; sousLabel?: string; deleted_at: string; raw: Record<string, unknown> };

function CorbeillePanel({ etabId }: { etabId: string }) {
  const [tab, setTab] = useState<"filieres" | "niveaux" | "etudiants" | "notes">("filieres");
  const [items, setItems] = useState<ItemCorbeille[]>([]);
  const [loading, setLoading] = useState(true);

  const TABLES: Record<string, { table: string; select: string; label: (r: any) => string; sousLabel?: (r: any) => string }> = {
    filieres: { table: "filieres", select: "id,nom,deleted_at", label: (r) => r.nom },
    niveaux: { table: "niveaux", select: "id,nom,ordre,deleted_at", label: (r) => r.nom },
    etudiants: { table: "etudiants_pre_inscrits", select: "id,nom_complet,email,deleted_at", label: (r) => r.nom_complet, sousLabel: (r) => r.email },
    notes: { table: "notes", select: "id,valeur,type_evaluation,deleted_at", label: (r) => `Note : ${r.valeur}/20`, sousLabel: (r) => r.type_evaluation },
  };

  async function load() {
    setLoading(true);
    const conf = TABLES[tab];
    let query: any = supabase.from(conf.table).select(conf.select).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (tab === "filieres" || tab === "niveaux" || tab === "etudiants") {
      query = supabase.from(conf.table).select(conf.select).eq("etablissement_id", etabId).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    }
    const { data } = await query;
    const rows = (data ?? []) as any[];
    setItems(rows.map((r) => ({
      id: r.id, label: conf.label(r), sousLabel: conf.sousLabel?.(r), deleted_at: r.deleted_at, raw: r,
    })));
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab, etabId]);

  async function restaurer(item: ItemCorbeille) {
    const conf = TABLES[tab];
    await supabase.from(conf.table).update({ deleted_at: null }).eq("id", item.id);
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "restauration",
      _table_name: conf.table,
      _record_id: item.id,
      _description: `Restauration : "${item.label}"`,
      _ancienne_valeur: null,
      _nouvelle_valeur: item.raw,
    });
    load();
  }

  async function supprimerDefinitivement(item: ItemCorbeille) {
    if (!confirm(`Supprimer définitivement "${item.label}" ? Cette action est IRRÉVERSIBLE.`)) return;
    const conf = TABLES[tab];
    await supabase.rpc("enregistrer_audit", {
      _etablissement_id: etabId,
      _action: "suppression_definitive",
      _table_name: conf.table,
      _record_id: item.id,
      _description: `Suppression définitive : "${item.label}"`,
      _ancienne_valeur: item.raw,
      _nouvelle_valeur: null,
    });
    await supabase.from(conf.table).delete().eq("id", item.id);
    load();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const onglets = [
    { k: "filieres", l: "Filières" },
    { k: "niveaux", l: "Niveaux" },
    { k: "etudiants", l: "Étudiants" },
    { k: "notes", l: "Notes" },
  ] as const;

  return (
    <div className="card-soft p-6">
      <h2 className="mb-4 font-bold">🗑️ Corbeille</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {onglets.map((o) => (
          <button
            key={o.k}
            onClick={() => setTab(o.k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === o.k ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}
          >
            {o.l}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">Corbeille vide.</p>}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-border bg-muted p-3 text-sm">
            <div>
              <span className="font-semibold text-muted-foreground">{item.label}</span>
              {item.sousLabel && <span className="ml-2 text-xs text-muted-foreground">{item.sousLabel}</span>}
              <div className="text-xs text-muted-foreground">Supprimé le {formatDate(item.deleted_at)}</div>
            </div>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => restaurer(item)} className="text-xs font-semibold text-primary underline">Restaurer</button>
              <button onClick={() => supprimerDefinitivement(item)} className="text-xs font-semibold text-destructive underline">Suppr. définitivement</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

          // -------------- Historique des actions --------------
type AuditLog = {
  id: string;
  admin_email: string | null;
  action: string;
  table_name: string;
  description: string | null;
  created_at: string;
};

const TABLE_LABELS: Record<string, string> = {
  filieres: "Filière",
  niveaux: "Niveau",
  etudiants_pre_inscrits: "Étudiant",
  notes: "Note",
  annonces: "Annonce",
  announcement_comments: "Commentaire",
  evenements: "Événement",
  cours_emploi_temps: "Emploi du temps",
};

const ACTION_LABELS: Record<string, { l: string; c: string }> = {
  suppression: { l: "Suppression", c: "text-destructive" },
  modification: { l: "Modification", c: "text-primary" },
  creation: { l: "Création", c: "icon-green" },
};

function HistoriquePanel({ etabId }: { etabId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreAction, setFiltreAction] = useState<string>("");

  async function load() {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("id,admin_email,action,table_name,description,created_at")
      .eq("etablissement_id", etabId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filtreAction) query = query.eq("action", filtreAction);
    const { data } = await query;
    setLogs((data as AuditLog[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [etabId, filtreAction]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="card-soft p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Historique des actions ({logs.length})</h2>
          <select
            value={filtreAction}
            onChange={(e) => setFiltreAction(e.target.value)}
            className="input-soft w-auto"
          >
            <option value="">Toutes les actions</option>
            <option value="suppression">Suppressions</option>
            <option value="modification">Modifications</option>
          </select>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && logs.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune action enregistrée pour le moment.</p>
        )}

        <div className="space-y-2">
          {logs.map((log) => {
            const actionInfo = ACTION_LABELS[log.action] ?? { l: log.action, c: "text-muted-foreground" };
            const tableLabel = TABLE_LABELS[log.table_name] ?? log.table_name;
            return (
              <div key={log.id} className="rounded-[10px] border border-border bg-surface p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${actionInfo.c}`}>{actionInfo.l}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tableLabel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                </div>
                <p className="mt-1">{log.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">Par {log.admin_email ?? "administrateur inconnu"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// -------------- Confirmation par saisie (suppressions sensibles) --------------
function ConfirmationSaisie({
  titre, message, motAttendu, onConfirm, onCancel,
}: {
  titre: string;
  message: string;
  motAttendu: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [saisie, setSaisie] = useState("");
  const ok = saisie.trim() === motAttendu.trim();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl">
        <h3 className="mb-2 font-bold text-destructive">{titre}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{message}</p>
        <p className="mb-2 text-sm">
          Pour confirmer, tapez : <strong className="font-mono">{motAttendu}</strong>
        </p>
        <input
          autoFocus
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          className="input-soft mb-4 w-full"
          placeholder={motAttendu}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-bf-outline">Annuler</button>
          <button
            onClick={onConfirm}
            disabled={!ok}
            className="rounded-[10px] bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
          >
            Supprimer
          </button>
        </div>
      </div>
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
