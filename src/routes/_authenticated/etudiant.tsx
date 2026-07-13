import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";
import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, Megaphone, Calendar, Clock, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/etudiant")({
  component: Dashboard,
});

const JOURS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function Dashboard() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [ctx, setCtx] = useState<{ niveauId: string; niveauLabel: string; etabNom: string; userName: string } | null>(null);
  const [tab, setTab] = useState<"annonces" | "edt" | "evenements" | "notes">("annonces");

  useEffect(() => {
    (async () => {
      const role = await resolveUserRole();
      if (role !== "etudiant") { window.location.href = "/"; return; }
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: pre } = await supabase.from("etudiants_pre_inscrits")
        .select("niveau_id, nom_complet, etablissement_id, filiere_id")
        .eq("user_id", u.user.id).eq("inscrit", true).maybeSingle();
      if (!pre) { window.location.href = "/"; return; }
      const [{ data: e }, { data: f }, { data: n }] = await Promise.all([
        supabase.from("etablissements").select("nom").eq("id", pre.etablissement_id).maybeSingle(),
        supabase.from("filieres").select("nom").eq("id", pre.filiere_id).maybeSingle(),
        supabase.from("niveaux").select("nom").eq("id", pre.niveau_id).maybeSingle(),
      ]);
      setCtx({
        niveauId: pre.niveau_id,
        niveauLabel: `${f?.nom ?? ""} — ${n?.nom ?? ""}`,
        etabNom: e?.nom ?? "",
        userName: pre.nom_complet,
      });
      setOk(true);
    })();
  }, []);

  if (ok === null) return <div className="p-8 text-center">Chargement…</div>;
  if (!ctx) return null;

  return (
    <div className="bg-paper min-h-screen text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            Campus<span className="text-terracotta">Link</span>
            <DrapeauBF className="h-4 w-6" />
            <span className="ml-3 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">Étudiant · {ctx.etabNom}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{ctx.userName} · {ctx.niveauLabel}</span>
            <button onClick={signOutAndGoHome} className="btn-bf-outline text-sm"><LogOut className="h-4 w-4" />Déconnexion</button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl gap-1 px-6 overflow-x-auto">
          {[
            { k: "annonces", l: "Annonces", i: <Megaphone className="h-4 w-4" /> },
            { k: "edt", l: "Emploi du temps", i: <Clock className="h-4 w-4" /> },
            { k: "evenements", l: "Événements", i: <Calendar className="h-4 w-4" /> },
            { k: "notes", l: "Mes notes", i: <GraduationCap className="h-4 w-4" /> },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k as never)}
              className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition ${tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {tab === "annonces" && <Annonces niveauId={ctx.niveauId} />}
        {tab === "edt" && <EDT niveauId={ctx.niveauId} />}
        {tab === "evenements" && <Evenements niveauId={ctx.niveauId} />}
        {tab === "notes" && <Notes />}
      </main>
    </div>
  );
}

function Annonces({ niveauId }: { niveauId: string }) {
  const [list, setList] = useState<{ id: string; titre: string; contenu: string; created_at: string }[]>([]);
  useEffect(() => {
    supabase.from("annonces").select("id,titre,contenu,created_at").eq("niveau_id", niveauId).order("created_at", { ascending: false })
      .then(({ data }) => setList((data as never) ?? []));
  }, [niveauId]);
  return (
    <div className="space-y-3">
      {list.map((a) => (
        <article key={a.id} className="card-glass rounded-xl p-5">
          <h3 className="font-bold">{a.titre}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.contenu}</p>
          <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
        </article>
      ))}
      {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune annonce pour votre niveau.</p>}
    </div>
  );
}

function EDT({ niveauId }: { niveauId: string }) {
  const [list, setList] = useState<{ jour_semaine: number; heure_debut: string; heure_fin: string; matiere: string; salle: string | null; enseignant: string | null }[]>([]);
  useEffect(() => {
    supabase.from("emplois_du_temps").select("*").eq("niveau_id", niveauId).order("jour_semaine").order("heure_debut")
      .then(({ data }) => setList((data as never) ?? []));
  }, [niveauId]);
  return (
    <div className="card-glass rounded-xl p-6">
      {[1, 2, 3, 4, 5, 6, 7].map((j) => {
        const items = list.filter((x) => x.jour_semaine === j);
        if (!items.length) return null;
        return (
          <div key={j} className="mb-4">
            <h3 className="mb-2 text-sm font-bold text-primary">{JOURS[j]}</h3>
            <div className="space-y-1">
              {items.map((x, idx) => (
                <div key={idx} className="rounded border border-border bg-surface p-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{x.heure_debut.slice(0, 5)}–{x.heure_fin.slice(0, 5)}</span>
                  {" · "}<strong>{x.matiere}</strong>
                  {x.salle && <span className="text-muted-foreground"> · {x.salle}</span>}
                  {x.enseignant && <span className="text-muted-foreground"> · {x.enseignant}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun cours planifié.</p>}
    </div>
  );
}

function Evenements({ niveauId }: { niveauId: string }) {
  const [list, setList] = useState<{ id: string; titre: string; description: string | null; date_evenement: string; lieu: string | null }[]>([]);
  useEffect(() => {
    supabase.from("evenements").select("*").eq("niveau_id", niveauId).order("date_evenement")
      .then(({ data }) => setList((data as never) ?? []));
  }, [niveauId]);
  return (
    <div className="space-y-3">
      {list.map((e) => (
        <article key={e.id} className="card-glass rounded-xl p-5">
          <h3 className="font-bold">{e.titre}</h3>
          <p className="text-xs text-muted-foreground">{new Date(e.date_evenement).toLocaleString("fr-FR")}{e.lieu ? ` · ${e.lieu}` : ""}</p>
          {e.description && <p className="mt-2 text-sm">{e.description}</p>}
        </article>
      ))}
      {list.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
    </div>
  );
}

function Notes() {
  const [list, setList] = useState<{ id: string; valeur: number; type_evaluation: string; commentaire: string | null; matiere_id: string; created_at: string }[]>([]);
  const [matieres, setMatieres] = useState<Record<string, { nom: string; coefficient: number }>>({});
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      const rows = (data as never as typeof list) ?? [];
      setList(rows);
      const ids = Array.from(new Set(rows.map((n) => n.matiere_id)));
      if (ids.length) {
        const { data: mats } = await supabase.from("matieres").select("id,nom,coefficient").in("id", ids);
        const m: Record<string, { nom: string; coefficient: number }> = {};
        (mats ?? []).forEach((x) => { m[x.id] = { nom: x.nom, coefficient: Number(x.coefficient) }; });
        setMatieres(m);
      }
    })();
  }, []);

  const byMat = list.reduce<Record<string, typeof list>>((acc, n) => {
    (acc[n.matiere_id] ??= [] as never).push(n); return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byMat).map(([mid, notes]) => {
        const mat = matieres[mid];
        const moy = notes.reduce((s, n) => s + Number(n.valeur), 0) / notes.length;
        return (
          <div key={mid} className="card-glass rounded-xl p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">{mat?.nom ?? "Matière"}</h3>
              <div className="text-sm">Moyenne : <strong className="text-primary">{moy.toFixed(2)}</strong> {mat && <span className="text-xs text-muted-foreground">· coef {mat.coefficient}</span>}</div>
            </div>
            <div className="space-y-1">
              {notes.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded border border-border bg-surface p-2 text-sm">
                  <span><strong>{n.valeur}</strong> <span className="text-xs text-muted-foreground">({n.type_evaluation})</span>{n.commentaire ? ` — ${n.commentaire}` : ""}</span>
                  <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {list.length === 0 && <p className="text-sm text-muted-foreground">Aucune note enregistrée pour le moment.</p>}
    </div>
  );
}
