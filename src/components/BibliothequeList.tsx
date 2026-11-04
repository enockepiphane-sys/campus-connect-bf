import { imageUrl } from "@/lib/images-contenu";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BoutonTelechargement } from "@/components/BoutonTelechargement";
import { BookPlus, Download, FileText, ImageIcon, Library, Link2, PlayCircle, Search, Video, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LecteurLien } from "@/components/LecteurLien";
import { analyserLien, etiquetteLien } from "@/lib/lecture-externe";
import { parseYoutube, youtubeMiniature } from "@/lib/youtube";
import { extensionOf, fileUrl, formatSize, isVideoType, listDocuments, listThemes, proposeBook, type Doc } from "@/lib/bibliotheque";

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function ProposerLivre({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [titre, setTitre] = useState("");
  const [auteur, setAuteur] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [trap, setTrap] = useState(""); // champ piège contre les robots
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function close() {
    onClose();
    setTimeout(() => {
      setDone(false);
      setError("");
    }, 300);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (trap) {
      setDone(true);
      return;
    }
    if (titre.trim().length < 2) {
      setError("Indiquez le titre du livre.");
      return;
    }
    try {
      const now = Date.now();
      const log: number[] = JSON.parse(localStorage.getItem("cl_prop_log") ?? "[]").filter((t: number) => now - t < 86400000);
      if (log.length >= 3) {
        setError("Vous avez déjà envoyé plusieurs propositions aujourd’hui. Revenez demain.");
        return;
      }
      setBusy(true);
      await proposeBook({ titre, auteur, commentaire });
      localStorage.setItem("cl_prop_log", JSON.stringify([...log, now]));
      setTitre("");
      setAuteur("");
      setCommentaire("");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L’envoi a échoué. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Proposer un livre</DialogTitle>
          <DialogDescription>Un livre, un roman, un cours… Dites-nous ce qui manque à la bibliothèque.</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
              <BookOpen className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-lg font-bold">Merci pour votre proposition !</p>
            <p className="mt-1 text-sm text-muted-foreground">Elle sera étudiée, et le livre sera ajouté s’il est retenu.</p>
            <Button className="mt-5" onClick={close}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="prop-titre" className="text-sm font-medium">
                Titre du livre *
              </label>
              <Input id="prop-titre" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={200} placeholder="Ex. : Les Soleils des indépendances" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prop-auteur" className="text-sm font-medium">
                Auteur (facultatif)
              </label>
              <Input id="prop-auteur" value={auteur} onChange={(e) => setAuteur(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prop-com" className="text-sm font-medium">
                Pourquoi ce livre ? (facultatif)
              </label>
              <Textarea id="prop-com" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} maxLength={1000} className="min-h-24" />
            </div>
            <input aria-hidden tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} name="site" className="hidden" />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              <BookPlus />
              {busy ? "Envoi…" : "Envoyer ma proposition"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LecteurVideo({ doc, onClose }: { doc: Doc | null; onClose: () => void }) {
  if (!doc) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words font-display text-xl">{doc.titre}</DialogTitle>
          <DialogDescription>{doc.auteur ?? "Vidéo de la bibliothèque"}</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl bg-black">
          <video src={fileUrl(doc)} controls playsInline autoPlay className="max-h-[70vh] w-full" />
        </div>
        {doc.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{doc.description}</p>}
      </DialogContent>
    </Dialog>
  );
}

function LienCard({ doc, color, onRead }: { doc: Doc; color: string; onRead: (d: Doc) => void }) {
  const a = analyserLien(doc.lien_url);
  const lecture = a.ok ? a.lecture : null;
  const yt = parseYoutube(doc.lien_url);
  const couverture = imageUrl(doc.image_path) ?? (yt ? youtubeMiniature(yt.id) : null);
  const Icon = lecture && (lecture.kind === "youtube" || lecture.kind === "video" || (lecture.kind === "iframe" && lecture.format === "video")) ? Video : lecture?.kind === "pdf" ? FileText : lecture?.kind === "image" ? ImageIcon : Link2;
  const lisible = Boolean(a.ok && a.integrable);
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex h-24 items-center justify-center overflow-hidden sm:h-28 lg:h-32" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        <span aria-hidden className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" />
        {couverture ? <img src={couverture} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" /> : <Icon aria-hidden strokeWidth={1.3} className="h-9 w-9 text-white/90 sm:h-11 sm:w-11" />}
        {yt && <PlayCircle aria-hidden className="absolute h-9 w-9 text-white drop-shadow-lg sm:h-10 sm:w-10" />}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-900 sm:text-[10px]">{lecture ? etiquetteLien(lecture) : "Lien"}</span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 break-words font-display text-sm font-bold leading-snug sm:text-base">{doc.titre}</h3>
        {doc.auteur && <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{doc.auteur}</p>}
        {doc.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{doc.description}</p>}
        {a.ok && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">Source : {a.fournisseur || a.hote}</p>}
        <div className="mt-auto flex gap-1.5 pt-3">
          <button type="button" onClick={() => onRead(doc)} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm" style={{ background: color }}>
            {lecture && (yt || lecture.kind === "video") ? <PlayCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            {lisible ? (yt || lecture?.kind === "video" ? "Regarder" : "Lire") : "Consulter"}
          </button>
        </div>
      </div>
    </article>
  );
}

function DocCard({ doc, color, onPlay, onRead }: { doc: Doc; color: string; onPlay: (d: Doc) => void; onRead: (d: Doc) => void }) {
  if (doc.lien_url) return <LienCard doc={doc} color={color} onRead={onRead} />;
  const isPdf = doc.fichier_type === "application/pdf";
  const isVideo = isVideoType(doc.fichier_type);
  const Icon = isPdf ? FileText : isVideo ? Video : ImageIcon;
  const couverture = imageUrl(doc.image_path);
  const name = `${doc.titre}.${extensionOf(doc.fichier_type)}`;
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex h-24 items-center justify-center overflow-hidden sm:h-28 lg:h-32" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        <span aria-hidden className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" />
        {couverture ? (
          <img src={couverture} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : isVideo ? (
          <video src={`${fileUrl(doc)}#t=0.5`} preload="metadata" muted playsInline aria-hidden tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Icon aria-hidden strokeWidth={1.3} className="h-9 w-9 text-white/90 sm:h-11 sm:w-11" />
        )}
        {isVideo && <PlayCircle aria-hidden className="absolute h-9 w-9 text-white drop-shadow-lg sm:h-10 sm:w-10" />}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-900 sm:text-[10px]">{isPdf ? "PDF" : isVideo ? "Vidéo" : "Photo"}</span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 break-words font-display text-sm font-bold leading-snug sm:text-base">{doc.titre}</h3>
        {doc.auteur && <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{doc.auteur}</p>}
        {doc.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{doc.description}</p>}
        {doc.taille ? <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{formatSize(doc.taille)}</p> : null}
        <div className="mt-auto flex gap-1.5 pt-3">
          {isVideo ? (
            <button
              type="button"
              onClick={() => onPlay(doc)}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm"
              style={{ background: color }}
            >
              <PlayCircle className="h-4 w-4" />
              Regarder
            </button>
          ) : (
            <a
              href={fileUrl(doc)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm"
              style={{ background: color }}
            >
              <BookOpen className="h-4 w-4" />
              Lire
            </a>
          )}
          <BoutonTelechargement
            url={fileUrl(doc, name)}
            ressource={`bibliotheque:${doc.id}`}
            label={`Télécharger ${doc.titre}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted"
          >
            <Download className="h-4 w-4" />
          </BoutonTelechargement>
        </div>
      </div>
    </article>
  );
}

export function BibliothequeList() {
  const themes = useQuery({ queryKey: ["bibliotheque-themes"], queryFn: listThemes });
  const docs = useQuery({ queryKey: ["bibliotheque-docs"], queryFn: () => listDocuments(false) });
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("");
  const [proposer, setProposer] = useState(false);
  const [video, setVideo] = useState<Doc | null>(null);
  const [lien, setLien] = useState<Doc | null>(null);

  const themeList = themes.data ?? [];
  const colorOf = (id: string) => themeList.find((t) => t.id === id)?.couleur ?? "#0F8A44";

  const filtered = useMemo(() => {
    const q = plain(search.trim());
    return (docs.data ?? []).filter((d) => {
      if (theme && d.theme_id !== theme) return false;
      if (!q) return true;
      const themeName = themeList.find((t) => t.id === d.theme_id)?.nom ?? "";
      return plain(`${d.titre} ${d.auteur ?? ""} ${d.description ?? ""} ${themeName}`).includes(q);
    });
  }, [docs.data, search, theme, themeList]);

  const groups = themeList.map((t) => ({ theme: t, docs: filtered.filter((d) => d.theme_id === t.id) })).filter((g) => g.docs.length > 0);
  const countOf = (id: string) => (docs.data ?? []).filter((d) => d.theme_id === id).length;
  const error = themes.error ?? docs.error;
  const loading = themes.isPending || docs.isPending;

  return (
    <section className="space-y-5">
      {/* Barre de recherche */}
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Rechercher un livre ou un cours"
              placeholder="Rechercher un livre, un auteur, un cours…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl pl-12 pr-10 text-base"
            />
            {search && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={() => setProposer(true)} className="h-12 rounded-2xl px-5">
            <BookPlus />
            Proposer un livre
          </Button>
        </div>

        {/* Thèmes */}
        <div role="group" aria-label="Thèmes" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={theme === ""}
            onClick={() => setTheme("")}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${theme === "" ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground/80 hover:bg-muted"}`}
          >
            Tous ({docs.data?.length ?? 0})
          </button>
          {themeList.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(active ? "" : t.id)}
                className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:brightness-95"
                style={active ? { background: t.couleur, borderColor: t.couleur, color: "#fff" } : { background: `${t.couleur}14`, borderColor: `${t.couleur}55`, color: t.couleur }}
              >
                {t.nom} ({countOf(t.id)})
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{error.message}</p>
          <Button
            variant="outline"
            onClick={() => {
              void themes.refetch();
              void docs.refetch();
            }}
          >
            Réessayer
          </Button>
        </div>
      )}
      {loading && !error && <p role="status">Chargement de la bibliothèque…</p>}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} document{filtered.length > 1 ? "s" : ""}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border py-14 text-center">
          <Library className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold">{docs.data?.length ? "Aucun résultat" : "La bibliothèque se remplit bientôt"}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {docs.data?.length ? "Essayez un autre mot, ou proposez le livre que vous cherchez." : "Aucun document pour le moment. Vous pouvez déjà proposer un livre à ajouter."}
          </p>
          <Button className="mt-5" variant="outline" onClick={() => setProposer(true)}>
            <BookPlus />
            Proposer un livre
          </Button>
        </div>
      )}

      {groups.map((g) => (
        <div key={g.theme.id} className="space-y-3">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold sm:text-xl">
            <span className="h-6 w-1.5 rounded-full" style={{ background: g.theme.couleur }} />
            {g.theme.nom}
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${g.theme.couleur}1f`, color: g.theme.couleur }}>
              {g.docs.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
            {g.docs.map((d) => (
              <DocCard key={d.id} doc={d} color={colorOf(d.theme_id)} onPlay={setVideo} onRead={setLien} />
            ))}
          </div>
        </div>
      ))}

      <ProposerLivre open={proposer} onClose={() => setProposer(false)} />
      <LecteurVideo doc={video} onClose={() => setVideo(null)} />
      <LecteurLien doc={lien} onClose={() => setLien(null)} />
    </section>
  );
}
