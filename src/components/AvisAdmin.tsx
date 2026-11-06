import { useEffect, useMemo, useState } from "react";
import { CornerDownRight, MessageSquareHeart, RefreshCw, Send, Trash2 } from "lucide-react";
import { Etoiles } from "@/components/AvisPlateforme";
import { db, type Avis } from "@/lib/avis";

type Filtre = "tous" | "sans_reponse" | 1 | 2 | 3 | 4 | 5;

// Espace super admin : voir les notes et commentaires, y répondre (remercier, approuver une suggestion…).
export function AvisAdmin() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [brouillons, setBrouillons] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  const charger = async () => {
    setChargement(true);
    const { data, error } = await db.from("avis_plateforme").select("*").order("created_at", { ascending: false });
    if (error) setErreur("Impossible de charger les avis. La migration SQL a-t-elle été exécutée ?");
    else setErreur("");
    setAvis((data as Avis[]) ?? []);
    setChargement(false);
  };
  useEffect(() => { void charger(); }, []);

  const moyenne = useMemo(() => (avis.length ? avis.reduce((s, a) => s + a.note, 0) / avis.length : 0), [avis]);
  const repartition = useMemo(() => [5, 4, 3, 2, 1].map((n) => ({ n, c: avis.filter((a) => a.note === n).length })), [avis]);
  const sansReponse = avis.filter((a) => !a.reponse).length;
  const visibles = avis.filter((a) => (filtre === "tous" ? true : filtre === "sans_reponse" ? !a.reponse : a.note === filtre));

  const repondre = async (a: Avis) => {
    const texte = (brouillons[a.id] ?? a.reponse ?? "").trim();
    if (!texte) return;
    setEnCours(a.id);
    const { error } = await db.from("avis_plateforme").update({ reponse: texte }).eq("id", a.id);
    setEnCours(null);
    if (error) { setErreur("La réponse n’a pas pu être envoyée."); return; }
    setErreur("");
    setBrouillons((b) => { const { [a.id]: _, ...reste } = b; return reste; });
    void charger();
  };
  const retirerReponse = async (a: Avis) => {
    setEnCours(a.id);
    await db.from("avis_plateforme").update({ reponse: null }).eq("id", a.id);
    setEnCours(null);
    void charger();
  };
  const supprimer = async (a: Avis) => {
    if (!window.confirm(`Supprimer l’avis de ${a.nom_affiche} ?`)) return;
    await db.from("avis_plateforme").delete().eq("id", a.id);
    void charger();
  };

  const filtres: { k: Filtre; l: string }[] = [
    { k: "tous", l: `Tous (${avis.length})` },
    { k: "sans_reponse", l: `Sans réponse (${sansReponse})` },
    ...[5, 4, 3, 2, 1].map((n) => ({ k: n as Filtre, l: `${n} ★` })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><MessageSquareHeart className="icon-gold h-6 w-6" />Notes et commentaires</h2>
        <button type="button" onClick={charger} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-muted">
          <RefreshCw className={`h-4 w-4 ${chargement ? "animate-spin" : ""}`} />Actualiser
        </button>
      </div>

      {erreur && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">{erreur}</p>}

      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="card-glass rounded-2xl p-5 text-center">
          <p className="font-display text-5xl font-extrabold tabular-nums">{avis.length ? moyenne.toFixed(1).replace(".", ",") : "—"}</p>
          <div className="mt-1 flex justify-center"><Etoiles valeur={moyenne} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{avis.length} avis</p>
        </div>
        <div className="card-glass space-y-1.5 rounded-2xl p-5">
          {repartition.map(({ n, c }) => (
            <div key={n} className="flex items-center gap-2 text-sm">
              <span className="w-8 shrink-0 tabular-nums">{n} ★</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#F0C419]" style={{ width: `${avis.length ? (c / avis.length) * 100 : 0}%` }} /></div>
              <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtres.map((f) => (
          <button key={String(f.k)} type="button" onClick={() => setFiltre(f.k)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${filtre === f.k ? "bg-primary-soft text-primary shadow-sm" : "border border-border text-muted-foreground hover:bg-muted/50"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {!chargement && visibles.length === 0 && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Aucun avis pour ce filtre.</p>}

      <ul className="space-y-4">
        {visibles.map((a) => (
          <li key={a.id} className="card-glass rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{a.nom_affiche}</p>
                <div className="mt-0.5 flex items-center gap-2"><Etoiles valeur={a.note} taille="h-4 w-4" /><span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              </div>
              <button type="button" onClick={() => supprimer(a)} aria-label="Supprimer cet avis" className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{a.commentaire ?? <span className="italic text-muted-foreground">Aucun commentaire.</span>}</p>

            <div className="mt-4 border-t border-border pt-3">
              {a.reponse && brouillons[a.id] === undefined ? (
                <div className="rounded-xl border border-primary/30 bg-primary-soft p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary"><CornerDownRight className="h-3.5 w-3.5" />Ta réponse</p>
                  <p className="mt-1 whitespace-pre-line text-sm">{a.reponse}</p>
                  <div className="mt-2 flex gap-4 text-xs font-semibold">
                    <button type="button" onClick={() => setBrouillons((b) => ({ ...b, [a.id]: a.reponse ?? "" }))} className="text-primary underline">Modifier</button>
                    <button type="button" onClick={() => retirerReponse(a)} disabled={enCours === a.id} className="text-destructive underline">Retirer</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={brouillons[a.id] ?? ""}
                    onChange={(e) => setBrouillons((b) => ({ ...b, [a.id]: e.target.value.slice(0, 1000) }))}
                    rows={3}
                    placeholder="Réponds : remercie, approuve une suggestion, explique…"
                    className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <button type="button" onClick={() => repondre(a)} disabled={enCours === a.id || !(brouillons[a.id] ?? "").trim()} className="btn-bf-primary disabled:opacity-50">
                    <Send className="h-4 w-4" />{enCours === a.id ? "Envoi…" : "Envoyer la réponse"}
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
