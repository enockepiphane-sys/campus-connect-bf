import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveUserRole, signOutAndGoHome } from "@/lib/auth";
import { setupPushNotifications } from "@/lib/push-notifications";

import { DrapeauBF } from "@/components/DrapeauBF";
import { LogOut, Megaphone, Calendar, Clock, GraduationCap, Pin, TrendingUp, Award, Heart, MessageCircle } from "lucide-react";

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
      // Notifications push : non bloquant, échec silencieux si refus/non supporté.
      void setupPushNotifications();

    })();
  }, []);

  if (ok === null) return <div className="p-8 text-center">Chargement…</div>;
  if (!ctx) return null;

  const tabs = [
    { k: "annonces", l: "Annonces", i: Megaphone, c: "icon-terracotta" },
    { k: "edt", l: "Emploi du temps", i: Clock, c: "icon-teal" },
    { k: "evenements", l: "Événements", i: Calendar, c: "icon-gold" },
    { k: "notes", l: "Mes notes", i: GraduationCap, c: "icon-violet" },
  ] as const;

  return (
    <div className="bg-app min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 flex-wrap items-center gap-2 font-display text-lg font-bold sm:text-xl">
            <span className="whitespace-nowrap">Campus<span className="text-terracotta">Link</span></span>
            <DrapeauBF className="h-4 w-6 shrink-0" />
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary sm:px-3 sm:py-1 sm:text-xs">Étudiant · {ctx.etabNom}</span>
          </Link>
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <span className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">{ctx.userName} · {ctx.niveauLabel}</span>
            <button onClick={signOutAndGoHome} className="btn-bf-outline shrink-0 text-sm"><LogOut className="icon-danger h-4 w-4" />Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-6">
        {tab === "annonces" && (
          <>
            <StatsBanner niveauId={ctx.niveauId} />
            <Annonces niveauId={ctx.niveauId} />
          </>
        )}
        {tab === "edt" && <EDT niveauId={ctx.niveauId} />}
        {tab === "evenements" && <Evenements niveauId={ctx.niveauId} />}
        {tab === "notes" && <Notes />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-5xl">
          {tabs.map((t) => {
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition ${active ? "text-foreground" : "text-muted-foreground/70"}`}
              >
                <t.i className={`h-5 w-5 ${t.c} ${active ? "" : "opacity-60"}`} strokeWidth={active ? 2.4 : 1.8} />
                <span className="truncate">{t.l}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function StatsBanner({ niveauId }: { niveauId: string }) {
  const [stats, setStats] = useState<{ label: string; value: string; sub: string; icon: typeof TrendingUp; color: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: notes }, { data: edt }] = await Promise.all([
        supabase.from("notes").select("valeur,matiere_id"),
        supabase.from("emplois_du_temps").select("*").eq("niveau_id", niveauId).order("jour_semaine").order("heure_debut"),
      ]);
      const rows = (notes as { valeur: number; matiere_id: string }[]) ?? [];
      const ids = Array.from(new Set(rows.map((n) => n.matiere_id)));
      let mats: { id: string; nom: string; coefficient: number; credits: number }[] = [];
      if (ids.length) {
        const { data } = await supabase.from("matieres").select("id,nom,coefficient,credits").in("id", ids);
        mats = (data as never) ?? [];
      }
      const byMat = new Map<string, number[]>();
      rows.forEach((n) => byMat.set(n.matiere_id, [...(byMat.get(n.matiere_id) ?? []), Number(n.valeur)]));

      let totalPts = 0, totalCoef = 0, credits = 0, totalCredits = 0;
      byMat.forEach((vals, mid) => {
        const mat = mats.find((m) => m.id === mid);
        const coef = Number(mat?.coefficient ?? 1);
        const cred = Number(mat?.credits ?? 0);
        const moy = vals.reduce((s, v) => s + v, 0) / vals.length;
        totalPts += moy * coef; totalCoef += coef;
        totalCredits += cred;
        if (moy >= 10) credits += cred;
      });

      const list = (edt as { jour_semaine: number; heure_debut: string; heure_fin: string; matiere: string; salle: string | null }[]) ?? [];
      const now = new Date();
      const today = ((now.getDay() + 6) % 7) + 1;
      const hm = now.toTimeString().slice(0, 8);
      const next =
        list.find((c) => c.jour_semaine === today && c.heure_debut > hm) ??
        list.find((c) => c.jour_semaine > today) ??
        list[0];

      setStats([
        {
          label: "Moyenne générale",
          value: totalCoef ? (totalPts / totalCoef).toFixed(2) : "—",
          sub: totalCoef ? "sur 20" : "aucune note",
          icon: TrendingUp, color: "icon-green",
        },
        {
          label: "Crédits validés",
          value: String(credits),
          sub: totalCredits ? `sur ${totalCredits}` : "aucune matière",
          icon: Award, color: "icon-gold",
        },
        {
          label: "Prochain cours",
          value: next ? next.matiere : "—",
          sub: next ? `${JOURS[next.jour_semaine]} ${next.heure_debut.slice(0, 5)}${next.salle ? ` · ${next.salle}` : ""}` : "aucun cours planifié",
          icon: Clock, color: "icon-teal",
        },
      ]);
    })();
  }, [niveauId]);


  if (!stats.length) return null;

  const Card = ({ s }: { s: (typeof stats)[number] }) => (
    <div className="card-soft w-56 shrink-0 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <s.icon className={`h-4 w-4 ${s.color}`} />
        {s.label}
      </div>
      <p className="mt-2 truncate text-xl font-bold text-foreground">{s.value}</p>
      <p className="truncate text-xs text-muted-foreground">{s.sub}</p>
    </div>
  );

  return (
    <div className="mb-6 overflow-hidden">
      <div className="marquee-track flex w-max gap-3">
        {[...stats, ...stats].map((s, i) => <Card key={i} s={s} />)}
      </div>
    </div>
  );
}

type AnnonceRow = { id: string; titre: string; contenu: string; created_at: string; is_urgent: boolean; comments_enabled: boolean };

function Annonces({ niveauId }: { niveauId: string }) {
  const [list, setList] = useState<AnnonceRow[]>([]);
  useEffect(() => {
    supabase.from("annonces").select("id,titre,contenu,created_at,is_urgent,comments_enabled").eq("niveau_id", niveauId).order("created_at", { ascending: false })
      .then(({ data }) => setList((data as never) ?? []));
  }, [niveauId]);

  if (list.length === 0) {
    return (
      <div className="card-soft flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Megaphone className="icon-terracotta h-8 w-8 opacity-60" />
        <p className="text-sm text-muted-foreground">Aucune annonce pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((a, i) => {
        const recent = Date.now() - new Date(a.created_at).getTime() < 7 * 864e5;
        return (
          <article key={a.id} className="card-soft p-5">
            {a.is_urgent && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-0.5 text-[11px] font-bold text-destructive-foreground">
                  🚨 URGENT
                </span>
              </div>
            )}
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${recent ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
                {recent ? "Nouveau" : "Annonce"}
              </span>
              {i === 0 && <Pin className="icon-terracotta h-3.5 w-3.5" />}
            </div>
            <h3 className="font-bold">{a.titre}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.contenu}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("fr-FR")}</p>
            <LikeButton annonceId={a.id} />
            {a.comments_enabled && <Commentaires annonceId={a.id} />}
          </article>
        );
      })}
    </div>
  );
}

function LikeButton({ annonceId }: { annonceId: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from("announcement_likes").select("id,user_id").eq("announcement_id", annonceId);
    const rows = (data as { id: string; user_id: string }[]) ?? [];
    setCount(rows.length);
    setLiked(!!u.user && rows.some((r) => r.user_id === u.user!.id));
  }
  useEffect(() => { load(); }, [annonceId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      if (liked) {
        await supabase.from("announcement_likes").delete().eq("announcement_id", annonceId).eq("user_id", u.user.id);
      } else {
        await supabase.from("announcement_likes").insert({ announcement_id: annonceId, user_id: u.user.id });
      }
      await load();
    }
    setBusy(false);
  }

  return (
    <button onClick={toggle} disabled={busy}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition disabled:opacity-60">
      <Heart className={`h-4 w-4 ${liked ? "icon-terracotta fill-current" : "text-muted-foreground"}`} />
      <span className={liked ? "font-semibold text-foreground" : "text-muted-foreground"}>{count}</span>
    </button>
  );
}

function Commentaires({ annonceId }: { annonceId: string }) {
  const [list, setList] = useState<{ id: string; content: string; created_at: string; user_id: string }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const { error } = await supabase.from("announcement_comments").insert({ announcement_id: annonceId, user_id: u.user.id, content });
      if (!error) { setText(""); await load(); }
    }
    setBusy(false);
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <MessageCircle className="icon-teal h-4 w-4" />
        Commentaires ({list.length})
      </div>
      <form onSubmit={publier} className="mb-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un commentaire…"
          className="input-soft flex-1" maxLength={2000} />
        <button className="btn-forest shrink-0" disabled={busy}>Publier</button>
      </form>
      <div className="space-y-2">
        {list.map((c) => (
          <div key={c.id} className="rounded-[10px] border border-border bg-surface p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{names[c.user_id] ?? "Étudiant"}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
            </div>
            <p className="whitespace-pre-wrap">{c.content}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-xs text-muted-foreground">Aucun commentaire pour le moment.</p>}
      </div>
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
    <div className="card-soft p-6">
      {[1, 2, 3, 4, 5, 6, 7].map((j) => {
        const items = list.filter((x) => x.jour_semaine === j);
        if (!items.length) return null;
        return (
          <div key={j} className="mb-4">
            <h3 className="mb-2 text-sm font-bold text-primary">{JOURS[j]}</h3>
            <div className="space-y-1">
              {items.map((x, idx) => (
                <div key={idx} className="rounded-[10px] border border-border bg-surface p-2 text-sm">
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
        <article key={e.id} className="card-soft p-5">
          <h3 className="font-bold">{e.titre}</h3>
          <p className="text-xs text-muted-foreground">{new Date(e.date_evenement).toLocaleString("fr-FR")}{e.lieu ? ` · ${e.lieu}` : ""}</p>
          {e.description && <p className="mt-2 text-sm">{e.description}</p>}
        </article>
      ))}
      {list.length === 0 && (
        <div className="card-soft flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Calendar className="icon-gold h-8 w-8 opacity-60" />
          <p className="text-sm text-muted-foreground">Aucun événement pour le moment</p>
        </div>
      )}
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
          <div key={mid} className="card-soft p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">{mat?.nom ?? "Matière"}</h3>
              <div className="text-sm">Moyenne : <strong className="text-primary">{moy.toFixed(2)}</strong> {mat && <span className="text-xs text-muted-foreground">· coef {mat.coefficient}</span>}</div>
            </div>
            <div className="space-y-1">
              {notes.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-[10px] border border-border bg-surface p-2 text-sm">
                  <span><strong>{n.valeur}</strong> <span className="text-xs text-muted-foreground">({n.type_evaluation})</span>{n.commentaire ? ` — ${n.commentaire}` : ""}</span>
                  <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="card-soft flex flex-col items-center gap-2 px-6 py-12 text-center">
          <GraduationCap className="icon-violet h-8 w-8 opacity-60" />
          <p className="text-sm text-muted-foreground">Aucune note enregistrée pour le moment</p>
        </div>
      )}
    </div>
  );
}
