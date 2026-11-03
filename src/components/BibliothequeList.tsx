import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookPlus, Download, FileText, ImageIcon, Library, Search, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fileUrl, formatSize, listDocuments, listThemes, proposeBook, type Doc } from "@/lib/bibliotheque";

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

function DocCard({ doc, color }: { doc: Doc; color: string }) {
  const isPdf = doc.fichier_type === "application/pdf";
  const Icon = isPdf ? FileText : ImageIcon;
  const name = `${doc.titre}.${isPdf ? "pdf" : doc.fichier_type.split("/")[1] === "jpeg" ? "jpg" : doc.fichier_type.split("/")[1]}`;
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex h-32 items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
        <Icon aria-hidden strokeWidth={1.3} className="h-14 w-14 text-white/90" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-900">{isPdf ? "PDF" : "Photo"}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 break-words font-display text-lg font-bold leading-snug">{doc.titre}</h3>
        {doc.auteur && <p className="mt-1 text-sm font-medium text-muted-foreground">{doc.auteur}</p>}
        {doc.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>}
        {doc.taille ? <p className="mt-3 text-xs text-muted-foreground">{formatSize(doc.taille)}</p> : null}
        <div className="mt-auto flex gap-2 pt-4">
          <a
            href={fileUrl(doc)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ background: color }}
          >
            <BookOpen className="h-4 w-4" />
            Lire
          </a>
          <a
            href={fileUrl(doc, name)}
            aria-label={`Télécharger ${doc.titre}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted"
          >
            <Download className="h-4 w-4" />
          </a>
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
    <section className="space-y-6">
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
        <div key={g.theme.id} className="space-y-4">
          <h2 className="flex items-center gap-3 font-display text-xl font-bold sm:text-2xl">
            <span className="h-7 w-1.5 rounded-full" style={{ background: g.theme.couleur }} />
            {g.theme.nom}
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: `${g.theme.couleur}1f`, color: g.theme.couleur }}>
              {g.docs.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
            {g.docs.map((d) => (
              <DocCard key={d.id} doc={d} color={colorOf(d.theme_id)} />
            ))}
          </div>
        </div>
      ))}

      <ProposerLivre open={proposer} onClose={() => setProposer(false)} />
    </section>
  );
}
