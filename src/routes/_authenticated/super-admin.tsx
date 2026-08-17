import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndGoHome } from "@/lib/auth";
import { humanizeDbError } from "@/lib/auth-timeout";
import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, Building2, UserPlus, Mail, ShieldAlert, History, PartyPopper, Trash2, RotateCcw } from "lucide-react";

const AFFICHES_SOCIALES_BUCKET = "affiches-evenements-sociaux";

async function afficheSocialeUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = supabase.storage.from(AFFICHES_SOCIALES_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

// Mot magique requis pour confirmer une suppression sensible (établissement / admin pré-autorisé)
const MOT_MAGIQUE_SUPPRESSION = "SUPPRIMER";

// ============ Journal d'audit (historique des actions) ============
type ActionType = "creation" | "modification" | "suppression";
type CibleType = "etablissement" | "admin_pre_autorise" | "demande_partenariat" | "evenement_social";
type Historique = {
  id: string;
  super_admin_email: string | null;
  action: ActionType;
  cible_type: CibleType;
  cible_nom: string | null;
  details: string | null;
  created_at: string;
};

// Enregistre une action dans la table historique_actions. Ne bloque jamais l'action principale
// même en cas d'échec de l'enregistrement (on log l'erreur en console seulement).
async function logAction(action: ActionType, cible_type: CibleType, cible_nom: string, details?: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    let super_admin_id: string | null = null;
    if (user) {
      const { data: sa } = await supabase.from("super_admins").select("id").eq("user_id", user.id).maybeSingle();
      super_admin_id = sa?.id ?? null;
    }
    await supabase.from("historique_actions").insert({
      super_admin_id,
      super_admin_email: user?.email ?? null,
      action,
      cible_type,
      cible_nom,
      details: details ?? null,
    });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de l'historique :", err);
  }
}

export const Route = createFileRoute("/_authenticated/super-admin")({
  component: Dashboard,
});

type Etab = { id: string; nom: string; email: string | null; telephone: string | null; adresse: string | null; description: string | null; statut: string; deleted_at?: string | null };
type PreAdmin = { id: string; nom_complet: string; email: string; date_naissance: string; inscrit: boolean; etablissement_id: string; deleted_at?: string | null };
type Demande = { id: string; nom_etablissement: string; nom_contact: string; email_contact: string; telephone_contact: string | null; message: string | null; statut: string; created_at: string };
type EvenementSocial = { id: string; titre: string; description: string | null; affiche_url: string | null; lien: string | null; date_evenement: string | null; actif: boolean; deleted_at?: string | null };

function Dashboard() {
  const [tab, setTab] = useState<"etabs" | "preadmins" | "demandes" | "evenements" | "historique" | "corbeille">("etabs");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setAuthorized(false);
        window.location.href = "/";
        return;
      }

      // Vérification directe côté client : user_id doit exister dans super_admins
      const { data: sa, error } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const ok = !error && Boolean(sa);
      setAuthorized(ok);
      if (!ok) window.location.href = "/";
    })();
  }, []);

  if (authorized === null) return <div className="p-8 text-center">Chargement…</div>;
  if (!authorized) return null;

  return (
    <div className="bg-app min-h-screen text-foreground">
      <header
        className="sticky top-0 z-30 border-b border-border"
        style={{ background: "linear-gradient(120deg, #0F8A44 0%, #12A150 55%, #F0C419 100%)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 font-display text-lg font-bold sm:text-xl">
            <span className="whitespace-nowrap">Campus<span className="text-terracotta">Link</span></span>
            <DrapeauBF className="h-4 w-6 shrink-0 rounded-[2px] shadow-sm" />
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm sm:px-3 sm:py-1 sm:text-xs">Super Admin</span>
          </div>
          <button
            onClick={signOutAndGoHome}
            aria-label="Déconnexion"
            className="inline-flex shrink-0 items-center justify-center rounded-[10px] border border-white/40 bg-white/10 p-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/20 sm:px-4 sm:py-2"
          >
            <LogOut className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 sm:flex-row sm:flex-wrap sm:px-6 sm:py-2">
          {[
            { k: "etabs", l: "Établissements", i: <Building2 className="icon-green h-4 w-4" /> },
            { k: "preadmins", l: "Pré-autorisations admin", i: <UserPlus className="icon-blue h-4 w-4" /> },
            { k: "demandes", l: "Demandes partenariat", i: <Mail className="icon-terracotta h-4 w-4" /> },
            { k: "evenements", l: "Événements sociaux", i: <PartyPopper className="icon-gold h-4 w-4" /> },
            { k: "corbeille", l: "Corbeille", i: <Trash2 className="text-destructive h-4 w-4" /> },
            { k: "historique", l: "Historique", i: <History className="icon-blue h-4 w-4" /> },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as never)}
              className={`inline-flex w-full items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition sm:w-auto ${tab === t.k ? "bg-primary-soft text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {tab === "etabs" && <EtablissementsPanel />}
        {tab === "preadmins" && <PreAdminsPanel />}
        {tab === "demandes" && <DemandesPanel />}
        {tab === "evenements" && <EvenementsSociauxPanel />}
        {tab === "corbeille" && <CorbeilleSuperAdminPanel />}
        {tab === "historique" && <HistoriquePanel />}
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
  const [toDelete, setToDelete] = useState<Etab | null>(null);

  async function load() {
    const { data } = await supabase.from("etablissements").select("*").is("deleted_at", null).order("nom");
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
      if (error) { setMsg(humanizeDbError(error)); return; }
      logAction("modification", "etablissement", payload.nom);
    } else {
      const { error } = await supabase.from("etablissements").insert(payload);
      if (error) { setMsg(humanizeDbError(error)); return; }
      logAction("creation", "etablissement", payload.nom);
    }
    setForm({ statut: "actif" }); setEditing(null); load();
  }

  async function del(id: string, nom: string) {
    await supabase.from("etablissements").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    logAction("suppression", "etablissement", nom, "Déplacé vers la corbeille");
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer un établissement"
          itemLabel={toDelete.nom}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { const id = toDelete.id; const nom = toDelete.nom; setToDelete(null); del(id, nom); }}
        />
      )}
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
                <button onClick={() => setToDelete(e)} className="text-xs text-destructive underline">Suppr.</button>
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
  const [toDelete, setToDelete] = useState<PreAdmin | null>(null);

  useEffect(() => {
    supabase.from("etablissements").select("*").is("deleted_at", null).order("nom").then(({ data }) => {
      setEtabs((data as Etab[]) ?? []);
      if (data && data.length && !selEtab) setSelEtab(data[0].id);
    });
  }, []);
  useEffect(() => {
    if (!selEtab) return;
    supabase.from("admins_pre_autorises").select("*").eq("etablissement_id", selEtab).is("deleted_at", null).order("nom_complet")
      .then(({ data }) => setList((data as PreAdmin[]) ?? []));
  }, [selEtab]);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!selEtab) return;
    const { error } = await supabase.from("admins_pre_autorises").insert({
      etablissement_id: selEtab, ...form, email: form.email.trim().toLowerCase(),
    });
    if (error) { setMsg(humanizeDbError(error)); return; }
    logAction("creation", "admin_pre_autorise", form.nom_complet, `Email : ${form.email.trim().toLowerCase()}`);
    setForm({ nom_complet: "", email: "", date_naissance: "" });
    const { data } = await supabase.from("admins_pre_autorises").select("*").eq("etablissement_id", selEtab).is("deleted_at", null).order("nom_complet");
    setList((data as PreAdmin[]) ?? []);
  }

  async function del(id: string, nomComplet: string) {
    await supabase.from("admins_pre_autorises").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    logAction("suppression", "admin_pre_autorise", nomComplet, "Déplacé vers la corbeille");
    setList((l) => l.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer un administrateur pré-autorisé"
          itemLabel={`${toDelete.nom_complet} (${toDelete.email})`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { const id = toDelete.id; const nom = toDelete.nom_complet; setToDelete(null); del(id, nom); }}
        />
      )}
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
                <button onClick={() => setToDelete(p)} className="text-xs text-destructive underline">Suppr.</button>
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
  async function setStatut(id: string, statut: string, nomEtablissement: string) {
    await supabase.from("demandes_partenariat").update({ statut }).eq("id", id);
    logAction("modification", "demande_partenariat", nomEtablissement, `Nouveau statut : ${statut}`);
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
              <select value={d.statut} onChange={(e) => setStatut(d.id, e.target.value, d.nom_etablissement)}
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

// ============ Événements sociaux (page d'accueil publique) ============
function EvenementsSociauxPanel() {
  const [list, setList] = useState<EvenementSocial[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ titre: "", description: "", lien: "", date_evenement: "", actif: true });
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<EvenementSocial | null>(null);

  async function load() {
    const { data } = await supabase.from("evenements_sociaux").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    const rows = (data as EvenementSocial[]) ?? [];
    setList(rows);
    const entries = await Promise.all(
      rows.filter((r) => r.affiche_url).map(async (r) => [r.affiche_url as string, await afficheSocialeUrl(r.affiche_url)] as const),
    );
    setUrls(Object.fromEntries(entries.filter(([, u]) => u)));
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ titre: "", description: "", lien: "", date_evenement: "", actif: true });
    setFile(null); setEditing(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!form.titre.trim() || form.titre.trim().length < 2) { setMsg("Titre requis"); return; }
    setBusy(true);
    try {
      let affiche_url: string | null = editing ? (list.find((e2) => e2.id === editing)?.affiche_url ?? null) : null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(AFFICHES_SOCIALES_BUCKET).upload(path, file, { contentType: file.type });
        if (upErr) { setMsg("Échec de l'envoi de l'affiche : " + humanizeDbError(upErr)); setBusy(false); return; }
        affiche_url = path;
      }
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        lien: form.lien.trim() || null,
        date_evenement: form.date_evenement || null,
        actif: form.actif,
        affiche_url,
      };
      if (editing) {
        const { error } = await supabase.from("evenements_sociaux").update(payload).eq("id", editing);
        if (error) { setMsg(humanizeDbError(error)); setBusy(false); return; }
        logAction("modification", "evenement_social", payload.titre);
      } else {
        const { error } = await supabase.from("evenements_sociaux").insert(payload);
        if (error) { setMsg(humanizeDbError(error)); setBusy(false); return; }
        logAction("creation", "evenement_social", payload.titre);
      }
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string, titre: string) {
    await supabase.from("evenements_sociaux").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    logAction("suppression", "evenement_social", titre, "Déplacé vers la corbeille");
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      {toDelete && (
        <ConfirmDeleteModal
          title="Supprimer un événement social"
          itemLabel={toDelete.titre}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { const id = toDelete.id; const titre = toDelete.titre; setToDelete(null); del(id, titre); }}
        />
      )}
      <div className="card-glass rounded-xl p-6">
        <h2 className="mb-4 text-lg font-bold">Événements sociaux ({list.length})</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Affichés publiquement sur la page d'accueil. Désactivez un événement pour le masquer sans le supprimer.
        </p>
        {msg && <div className="mb-3 rounded bg-destructive/10 p-2 text-sm text-destructive">{msg}</div>}
        <div className="space-y-3">
          {list.map((ev) => {
            const img = ev.affiche_url ? urls[ev.affiche_url] : null;
            return (
              <div key={ev.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                {img && <img src={img} alt={`Affiche de ${ev.titre}`} loading="lazy" className="h-32 w-full object-cover" />}
                <div className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{ev.titre}</span>
                      {!ev.actif && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">masqué</span>}
                    </div>
                    {ev.date_evenement && (
                      <p className="text-xs text-muted-foreground">{new Date(ev.date_evenement).toLocaleString("fr-FR")}</p>
                    )}
                    {ev.description && <p className="mt-1 line-clamp-2 text-sm">{ev.description}</p>}
                    {ev.lien && <p className="mt-1 truncate text-xs text-primary">{ev.lien}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button onClick={() => {
                      setEditing(ev.id);
                      setForm({
                        titre: ev.titre, description: ev.description ?? "", lien: ev.lien ?? "",
                        date_evenement: ev.date_evenement ? ev.date_evenement.slice(0, 16) : "", actif: ev.actif,
                      });
                      setFile(null);
                    }} className="text-xs text-primary underline">Modifier</button>
                    <button onClick={() => setToDelete(ev)} className="text-xs text-destructive underline">Suppr.</button>
                  </div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement social pour le moment.</p>}
        </div>
      </div>

      <form onSubmit={save} className="card-glass space-y-3 rounded-xl p-6">
        <h3 className="font-bold">{editing ? "Modifier" : "Ajouter"} un événement social</h3>
        <Input label="Titre *" v={form.titre} on={(v) => setForm({ ...form, titre: v })} />
        <div>
          <label className="mb-1 block text-sm">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
          />
        </div>
        <Input label="Lien (inscription / page de l'événement)" v={form.lien} on={(v) => setForm({ ...form, lien: v })} />
        <Input label="Date & heure" v={form.date_evenement} on={(v) => setForm({ ...form, date_evenement: v })} type="datetime-local" />
        <div>
          <label className="mb-1 block text-sm">Affiche {editing ? "(laisser vide pour garder l'actuelle)" : ""}</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
          Visible sur la page d'accueil
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-bf-primary flex-1 disabled:opacity-60">
            {busy ? "Envoi..." : editing ? "Enregistrer" : "Ajouter"}
          </button>
          {editing && <button type="button" onClick={resetForm} className="btn-bf-outline">Annuler</button>}
        </div>
      </form>
    </div>
  );
}

// ============ Corbeille (centralisée) ============
type ItemCorbeilleSA = { id: string; label: string; sousLabel?: string; deleted_at: string; raw: Record<string, unknown> };

function CorbeilleSuperAdminPanel() {
  const [tab, setTab] = useState<"etabs" | "preadmins" | "evenements">("etabs");
  const [items, setItems] = useState<ItemCorbeilleSA[]>([]);
  const [loading, setLoading] = useState(true);

  const TABLES: Record<string, { table: string; select: string; label: (r: Record<string, unknown>) => string; sousLabel?: (r: Record<string, unknown>) => string; cibleType: CibleType }> = {
    etabs: { table: "etablissements", select: "id,nom,email,deleted_at", label: (r) => String(r.nom), sousLabel: (r) => (r.email ? String(r.email) : ""), cibleType: "etablissement" },
    preadmins: { table: "admins_pre_autorises", select: "id,nom_complet,email,deleted_at", label: (r) => String(r.nom_complet), sousLabel: (r) => String(r.email), cibleType: "admin_pre_autorise" },
    evenements: { table: "evenements_sociaux", select: "id,titre,deleted_at", label: (r) => String(r.titre), cibleType: "evenement_social" },
  };

  async function load() {
    setLoading(true);
    const conf = TABLES[tab];
    const { data } = await supabase.from(conf.table).select(conf.select).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    const rows = (data ?? []) as Record<string, unknown>[];
    setItems(rows.map((r) => ({
      id: String(r.id), label: conf.label(r), sousLabel: conf.sousLabel?.(r), deleted_at: String(r.deleted_at), raw: r,
    })));
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab]);

  async function restaurer(item: ItemCorbeilleSA) {
    const conf = TABLES[tab];
    await supabase.from(conf.table).update({ deleted_at: null }).eq("id", item.id);
    logAction("modification", conf.cibleType, item.label, "Restauré depuis la corbeille");
    load();
  }

  async function supprimerDefinitivement(item: ItemCorbeilleSA) {
    if (!confirm(`Supprimer définitivement "${item.label}" ? Cette action est IRRÉVERSIBLE.`)) return;
    const conf = TABLES[tab];
    await supabase.from(conf.table).delete().eq("id", item.id);
    logAction("suppression", conf.cibleType, item.label, "Suppression définitive depuis la corbeille");
    load();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const onglets = [
    { k: "etabs", l: "Établissements" },
    { k: "preadmins", l: "Pré-admins" },
    { k: "evenements", l: "Événements sociaux" },
  ] as const;

  return (
    <div className="card-glass rounded-xl p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Trash2 className="text-destructive h-5 w-5" /> Corbeille
      </h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {onglets.map((o) => (
          <button
            key={o.k}
            onClick={() => setTab(o.k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${tab === o.k ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
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
            <div className="min-w-0">
              <span className="font-semibold text-foreground">{item.label}</span>
              {item.sousLabel && <span className="ml-2 text-xs text-muted-foreground">{item.sousLabel}</span>}
              <div className="text-xs text-muted-foreground">Supprimé le {formatDate(item.deleted_at)}</div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button onClick={() => restaurer(item)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline">
                <RotateCcw className="h-3 w-3" /> Restaurer
              </button>
              <button onClick={() => supprimerDefinitivement(item)} className="inline-flex items-center gap-1 text-xs font-semibold text-destructive underline">
                <Trash2 className="h-3 w-3" /> Suppr. définitivement
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Historique des actions ============
const ACTION_LABEL: Record<ActionType, string> = {
  creation: "Création",
  modification: "Modification",
  suppression: "Suppression",
};
const ACTION_STYLE: Record<ActionType, string> = {
  creation: "bg-green-500/10 text-green-600",
  modification: "bg-blue-500/10 text-blue-600",
  suppression: "bg-destructive/10 text-destructive",
};
const CIBLE_LABEL: Record<CibleType, string> = {
  etablissement: "Établissement",
  admin_pre_autorise: "Administrateur pré-autorisé",
  demande_partenariat: "Demande de partenariat",
  evenement_social: "Événement social",
};

function HistoriquePanel() {
  const [list, setList] = useState<Historique[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreAction, setFiltreAction] = useState<ActionType | "toutes">("toutes");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("historique_actions").select("*").order("created_at", { ascending: false }).limit(200);
    setList((data as Historique[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filtreAction === "toutes" ? list : list.filter((h) => h.action === filtreAction);

  return (
    <div className="card-glass rounded-xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Historique des actions ({filtered.length})</h2>
        <div className="flex items-center gap-2">
          <select value={filtreAction} onChange={(e) => setFiltreAction(e.target.value as never)}
            className="rounded border border-input bg-surface px-2 py-1 text-sm">
            <option value="toutes">Toutes les actions</option>
            <option value="creation">Créations</option>
            <option value="modification">Modifications</option>
            <option value="suppression">Suppressions</option>
          </select>
          <button onClick={load} className="text-xs text-primary underline">Actualiser</button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune action enregistrée pour le moment.</p>
      )}

      <div className="space-y-2">
        {filtered.map((h) => {
          const d = new Date(h.created_at);
          const dateStr = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
          const heureStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={h.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_STYLE[h.action]}`}>
                    {ACTION_LABEL[h.action]}
                  </span>
                  <span className="text-xs text-muted-foreground">{CIBLE_LABEL[h.cible_type]}</span>
                </div>
                <div className="mt-1 font-semibold">{h.cible_nom ?? "—"}</div>
                {h.details && <div className="text-xs text-muted-foreground">{h.details}</div>}
                <div className="mt-1 text-xs text-muted-foreground">
                  Par {h.super_admin_email ?? "super admin inconnu"}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <div>{dateStr}</div>
                <div>{heureStr}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Modale de confirmation de suppression (mot magique) ============
function ConfirmDeleteModal({
  title,
  itemLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  itemLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function handleConfirm() {
    if (saisie.trim().toUpperCase() !== MOT_MAGIQUE_SUPPRESSION) {
      setErreur(`Veuillez saisir exactement "${MOT_MAGIQUE_SUPPRESSION}" pour confirmer.`);
      return;
    }
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="font-bold">{title}</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Cette action est <span className="font-semibold text-destructive">irréversible</span>. Vous êtes sur le point de supprimer :
          <br />
          <span className="font-semibold text-foreground">{itemLabel}</span>
        </p>
        <p className="mb-2 text-sm">
          Pour confirmer, saisissez le mot <span className="font-mono font-bold">{MOT_MAGIQUE_SUPPRESSION}</span> ci-dessous :
        </p>
        <input
          type="text"
          value={saisie}
          onChange={(e) => { setSaisie(e.target.value); setErreur(null); }}
          className="mb-2 w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-destructive"
          placeholder={MOT_MAGIQUE_SUPPRESSION}
          autoFocus
        />
        {erreur && <div className="mb-2 rounded bg-destructive/10 p-2 text-sm text-destructive">{erreur}</div>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="btn-bf-outline flex-1">Annuler</button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saisie.trim().toUpperCase() !== MOT_MAGIQUE_SUPPRESSION}
            className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmer la suppression
          </button>
        </div>
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
