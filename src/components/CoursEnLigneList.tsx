import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, FileText, ImageIcon, PenLine, PlayCircle, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { imageUrl } from "@/lib/images-contenu";
import { NIVEAUX, coursFileUrl, embedUrl, extensionOf, formatSize, listCours, type Cours, type TypeContenu } from "@/lib/cours-en-ligne";

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const COLOR = "#c2410c";
const META: Record<TypeContenu, { label: string; Icon: typeof FileText }> = {
  video: { label: "Vidéo", Icon: PlayCircle },
  pdf: { label: "PDF", Icon: FileText },
  manuscrit: { label: "Manuscrit", Icon: PenLine },
  photo: { label: "Photo", Icon: ImageIcon },
};
const selectCls = "h-12 w-full rounded-2xl border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring";

function Lecteur({ cours, onClose }: { cours: Cours | null; onClose: () => void }) {
  if (!cours) return null;
  const embed = embedUrl(cours.video_url);
  const url = coursFileUrl(cours);
  const isVideoFile = cours.fichier_type?.startsWith("video/");
  const isImage = cours.fichier_type?.startsWith("image/");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{cours.titre}</DialogTitle>
          <DialogDescription>
            {cours.filiere} · {cours.niveau} · {cours.module}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl bg-black">
          {url && isVideoFile ? (
            <video src={url} controls playsInline className="max-h-[70vh] w-full" />
          ) : url && isImage ? (
            <img src={url} alt={cours.titre} className="max-h-[70vh] w-full bg-white object-contain" />
          ) : embed ? (
            <iframe src={embed} title={cours.titre} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full" />
          ) : null}
        </div>
        {cours.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{cours.description}</p>}
        {!url && cours.video_url && !embed && (
          <a href={cours.video_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline">
            Ouvrir la vidéo
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CoursCard({ c, onOpen }: { c: Cours; onOpen: () => void }) {
  const { label, Icon } = META[c.type_contenu];
  const url = coursFileUrl(c);
  const isPdf = c.fichier_type === "application/pdf";
  const couverture = imageUrl(c.image_path);
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex h-28 items-center justify-center overflow-hidden sm:h-36" style={{ background: `linear-gradient(135deg, #431407, ${COLOR}, #e0764f)` }}>
        <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
        {couverture ? <img src={couverture} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <Icon aria-hidden strokeWidth={1.3} className="h-12 w-12 text-white/90" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-900">{label}</span>
        <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-bold text-white">{c.niveau}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLOR }}>{c.module}</p>
        <h3 className="mt-1 line-clamp-2 break-words font-display text-lg font-bold leading-snug">{c.titre}</h3>
        {c.enseignant && <p className="mt-1 text-sm font-medium text-muted-foreground">{c.enseignant}</p>}
        {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
        {c.taille ? <p className="mt-3 text-xs text-muted-foreground">{formatSize(c.taille)}</p> : null}
        <div className="mt-auto flex gap-2 pt-4">
          {isPdf ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" style={{ background: COLOR }}>
              <BookOpen className="h-4 w-4" />
              Lire
            </a>
          ) : (
            <button type="button" onClick={onOpen} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" style={{ background: COLOR }}>
              {c.type_contenu === "video" ? <PlayCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
              {c.type_contenu === "video" ? "Regarder" : "Voir"}
            </button>
          )}
          {url && (
            <a href={coursFileUrl(c, `${c.titre}.${extensionOf(c.fichier_type ?? "")}`)} aria-label={`Télécharger ${c.titre}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted">
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function CoursEnLigneList() {
  const cours = useQuery({ queryKey: ["cours-en-ligne"], queryFn: () => listCours(false) });
  const [filiere, setFiliere] = useState("");
  const [niveau, setNiveau] = useState("");
  const [module, setModule] = useState("");
  const [search, setSearch] = useState("");
  const [ouvert, setOuvert] = useState<Cours | null>(null);
  const all = cours.data ?? [];

  const filieres = useMemo(() => [...new Set(all.map((c) => c.filiere))].sort((a, b) => a.localeCompare(b, "fr")), [all]);
  const niveaux = NIVEAUX.filter((n) => all.some((c) => c.niveau === n && (!filiere || c.filiere === filiere)));
  const modules = useMemo(
    () => [...new Set(all.filter((c) => (!filiere || c.filiere === filiere) && (!niveau || c.niveau === niveau)).map((c) => c.module))].sort((a, b) => a.localeCompare(b, "fr")),
    [all, filiere, niveau],
  );

  const filtered = useMemo(() => {
    const q = plain(search.trim());
    return all.filter((c) => {
      if (filiere && c.filiere !== filiere) return false;
      if (niveau && c.niveau !== niveau) return false;
      if (module && c.module !== module) return false;
      if (!q) return true;
      return plain(`${c.titre} ${c.module} ${c.filiere} ${c.enseignant ?? ""} ${c.description ?? ""}`).includes(q);
    });
  }, [all, filiere, niveau, module, search]);

  // Regroupement : Filière › Niveau
  const groups = useMemo(() => {
    const map = new Map<string, Cours[]>();
    for (const c of filtered) {
      const k = `${c.filiere} › ${c.niveau}`;
      map.set(k, [...(map.get(k) ?? []), c]);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Choisis ta filière, ton niveau puis ton module pour trouver tes cours.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
          <select aria-label="Filière" value={filiere} onChange={(e) => { setFiliere(e.target.value); setNiveau(""); setModule(""); }} className={selectCls}>
            <option value="">Toutes les filières</option>
            {filieres.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select aria-label="Niveau" value={niveau} onChange={(e) => { setNiveau(e.target.value); setModule(""); }} className={selectCls}>
            <option value="">Tous les niveaux</option>
            {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select aria-label="Module" value={module} onChange={(e) => setModule(e.target.value)} className={selectCls}>
            <option value="">Tous les modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Rechercher un cours" placeholder="Rechercher un cours, un module, un enseignant…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 rounded-2xl pl-12 pr-10 text-base" />
          {search && (
            <button type="button" aria-label="Effacer la recherche" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {cours.isPending && <p role="status" className="text-center text-muted-foreground">Chargement des cours…</p>}
      {cours.error && <p role="alert" className="rounded-2xl border border-destructive/30 p-6 text-center text-destructive">{(cours.error as Error).message}</p>}
      {!cours.isPending && !cours.error && !filtered.length && (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {all.length ? "Aucun cours ne correspond à ta recherche." : "Les premiers cours arrivent bientôt. Reviens vite !"}
        </p>
      )}

      {groups.map(([titre, list]) => (
        <div key={titre}>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <span className="h-6 w-1.5 rounded-full" style={{ background: COLOR }} />
            {titre} <span className="text-sm font-medium text-muted-foreground">({list.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
            {list.map((c) => <CoursCard key={c.id} c={c} onOpen={() => setOuvert(c)} />)}
          </div>
        </div>
      ))}
      <Lecteur cours={ouvert} onClose={() => setOuvert(null)} />
    </section>
  );
}
