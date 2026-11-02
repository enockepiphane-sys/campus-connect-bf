import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MOTIFS, deleteAnnonce, formatPrix, listAnnoncesModeration, listSignalements, moderer, photoUrl, tempsEcoule,
  TYPES_ANNONCE, type Annonce,
} from "@/lib/marche";
import { MarcheMonetisationAdmin } from "./MarcheMonetisationAdmin";

type Filtre = "signalees" | "masquees" | "toutes";

export function MarcheAdmin() {
  const cache = useQueryClient();
  const annonces = useQuery({ queryKey: ["marche-moderation-annonces"], queryFn: listAnnoncesModeration });
  const signalements = useQuery({ queryKey: ["marche-moderation-signalements"], queryFn: listSignalements });
  const [filtre, setFiltre] = useState<Filtre>("signalees");
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  const parAnnonce = new Map<string, { motif: string; details: string | null }[]>();
  for (const s of signalements.data ?? []) {
    const liste = parAnnonce.get(s.annonce_id) ?? [];
    liste.push({ motif: MOTIFS.find((m) => m.value === s.motif)?.label ?? s.motif, details: s.details });
    parAnnonce.set(s.annonce_id, liste);
  }
  const toutes = annonces.data ?? [];
  const affichees = toutes.filter((a) => (filtre === "signalees" ? parAnnonce.has(a.id) : filtre === "masquees" ? a.masquee : true));

  function rafraichir() {
    void cache.invalidateQueries({ queryKey: ["marche-moderation-annonces"] });
    void cache.invalidateQueries({ queryKey: ["marche-moderation-signalements"] });
    void cache.invalidateQueries({ queryKey: ["marche-annonces"] });
  }
  async function agir(a: Annonce, action: "masquer" | "afficher" | "supprimer") {
    if (action === "supprimer" && !window.confirm(`Supprimer définitivement « ${a.titre} » ?`)) return;
    setEnCours(a.id);
    setErreur("");
    try {
      if (action === "supprimer") await deleteAnnonce(a);
      else await moderer(a.id, action === "masquer");
      rafraichir();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setEnCours(null);
    }
  }

  const options: { k: Filtre; l: string; n: number }[] = [
    { k: "signalees", l: "Signalées", n: toutes.filter((a) => parAnnonce.has(a.id)).length },
    { k: "masquees", l: "Masquées", n: toutes.filter((a) => a.masquee).length },
    { k: "toutes", l: "Toutes", n: toutes.length },
  ];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold">Marché étudiant — revenus</h2>
        <p className="text-sm text-muted-foreground">Annonces à la une, abonnements Vendeur Pro et bannières publicitaires, payés par Orange Money / Moov Money.</p>
      </div>
      <MarcheMonetisationAdmin />
      <div>
        <h2 className="font-display text-2xl font-bold">Marché étudiant — modération</h2>
        <p className="text-sm text-muted-foreground">Une annonce signalée par 3 personnes différentes est masquée automatiquement. Tu peux la réafficher ou la supprimer.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.k} type="button" aria-pressed={filtre === o.k} onClick={() => setFiltre(o.k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filtre === o.k ? "bg-primary-soft text-primary shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {o.l} ({o.n})
          </button>
        ))}
      </div>

      {(erreur || annonces.error || signalements.error) && (
        <p role="alert" className="text-sm text-destructive">
          {erreur || (annonces.error instanceof Error ? annonces.error.message : signalements.error instanceof Error ? signalements.error.message : "Chargement impossible.")}
        </p>
      )}
      {annonces.isPending && <p role="status">Chargement…</p>}
      {!annonces.isPending && affichees.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aucune annonce dans cette liste.</p>}

      <ul className="space-y-3">
        {affichees.map((a) => {
          const motifs = parAnnonce.get(a.id) ?? [];
          const type = TYPES_ANNONCE.find((t) => t.value === a.type_annonce)?.court ?? a.type_annonce;
          return (
            <li key={a.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row">
              {a.photos[0] && <img src={photoUrl(a.photos[0])} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="break-words font-semibold">{a.titre}</p>
                <p className="text-xs text-muted-foreground">
                  {type} · {a.categorie} · {formatPrix(a.prix, a.type_annonce)} · {a.ville} · {tempsEcoule(a.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">Par {a.auteur_nom}{a.contact ? ` · ${a.contact}` : ""}{a.statut === "terminee" ? " · terminée" : ""}</p>
                <p className="line-clamp-2 break-words text-sm">{a.description}</p>
                {a.masquee && <p className="flex items-center gap-1 text-xs font-semibold text-destructive"><EyeOff className="h-3.5 w-3.5" />Masquée</p>}
                {motifs.length > 0 && (
                  <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                    <p className="flex items-center gap-1 font-semibold"><Flag className="h-3.5 w-3.5" />{motifs.length} signalement{motifs.length > 1 ? "s" : ""}</p>
                    <ul className="mt-1 list-disc pl-5">
                      {motifs.map((m, i) => (<li key={i} className="break-words">{m.motif}{m.details ? ` — ${m.details}` : ""}</li>))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                <Button size="sm" variant="outline" disabled={enCours === a.id} onClick={() => void agir(a, a.masquee ? "afficher" : "masquer")}>
                  {a.masquee ? <Eye /> : <EyeOff />}
                  {a.masquee ? "Réafficher" : "Masquer"}
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" disabled={enCours === a.id} onClick={() => void agir(a, "supprimer")}>
                  <Trash2 />
                  Supprimer
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
