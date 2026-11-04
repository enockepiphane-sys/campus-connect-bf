import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, FileText, ImageIcon, PenLine, PlayCircle, Search, X } from "lucide-react";
import { BoutonTelechargement } from "@/components/BoutonTelechargement";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { imageUrl } from "@/lib/images-contenu";
import { parseYoutube, youtubeMiniature } from "@/lib/youtube";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { NIVEAUX, coursFileUrl, embedUrl, extensionOf, filieresOf, grouperCours, niveauxOf, formatSize, listCours, type Cours, type TypeContenu } from "@/lib/cours-en-ligne";

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
  const youtube = parseYoutube(cours.video_url);
  const url = coursFileUrl(cours);
  const isVideoFile = cours.fichier_type?.startsWith("video/");
  const isImage = cours.fichier_type?.startsWith("image/");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{cours.titre}</DialogTitle>
          <DialogDescription>
            {filieresOf(cours).join(" + ")} · {niveauxOf(cours).join(" + ")} · {cours.module}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl bg-black">
          {url && isVideoFile ? (
            <video src={url} controls playsInline className="max-h-[70vh] w-full" />
          ) : url && isImage ? (
            <img src={url} alt={cours.titre} className="max-h-[70vh] w-full bg-white object-contain" />
          ) : youtube ? (
            <YouTubePlayer video={youtube} titre={cours.titre} />
          ) : embed ? (
            <iframe src={embed} title={cours.titre} allow="autoplay; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="aspect-video w-full" />
          ) : null}
        </div>
        {cours.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{cours.description}</p>}
        {!url && cours.video_url && !embed && (
          <p className="text-sm text-muted-foreground">Ce lien ne peut pas être lu dans CampusLink (seuls YouTube et Vimeo sont pris en charge).</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CoursCard({ c, onOpen }: { c: Cours; onOpen: () => void }) {
  const { label, Icon } = META[c.type_contenu];
  const url = coursFileUrl(c);
  const isPdf = c.fichier_type === "application/pdf";
  const yt = parseYoutube(c.video_url);
  const couverture = imageUrl(c.image_path) ?? (yt && !c.fichier_path ? youtubeMiniature(yt.id) : null);
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex h-24 items-center justify-center overflow-hidden sm:h-28 lg:h-32" style={{ background: `linear-gradient(135deg, #431407, ${COLOR}, #e0764f)` }}>
        <span aria-hidden className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/15" />
        {couverture ? <img src={couverture} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" /> : <Icon aria-hidden strokeWidth={1.3} className="h-9 w-9 text-white/90 sm:h-11 sm:w-11" />}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-900 sm:text-[10px]">{label}</span>
        <span className="absolute right-2 top-2 max-w-[55%] truncate rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold text-white sm:text-[10px]">{niveauxOf(c).join(" + ")}</span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider sm:text-xs" style={{ color: COLOR }}>{c.module}</p>
        <h3 className="mt-0.5 line-clamp-2 break-words font-display text-sm font-bold leading-snug sm:text-base">{c.titre}</h3>
        {c.enseignant && <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">{c.enseignant}</p>}
        {c.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{c.description}</p>}
        {c.taille ? <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{formatSize(c.taille)}</p> : null}
        <div className="mt-auto flex gap-1.5 pt-3">
          {isPdf ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm" style={{ background: COLOR }}>
              <BookOpen className="h-4 w-4" />
              Lire
            </a>
          ) : (
            <button type="button" onClick={onOpen} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white transition hover:brightness-110 sm:text-sm" style={{ background: COLOR }}>
              {c.type_contenu === "video" ? <PlayCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
              {c.type_contenu === "video" ? "Regarder" : "Voir"}
            </button>
          )}
          {url && (
            <BoutonTelechargement url={coursFileUrl(c, `${c.titre}.${extensionOf(c.fichier_type ?? "")}`)} ressource={`cours:${c.id}`} label={`Télécharger ${c.titre}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted">
              <Download className="h-4 w-4" />
            </BoutonTelechargement>
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

  const filieres = useMemo(() => [...new Set(all.flatMap(filieresOf))].sort((a, b) => a.localeCompare(b, "fr")), [all]);
  const niveaux = NIVEAUX.filter((n) => all.some((c) => niveauxOf(c).includes(n) && (!filiere || filieresOf(c).includes(filiere))));
  const modules = useMemo(
    () => [...new Set(all.filter((c) => (!filiere || filieresOf(c).includes(filiere)) && (!niveau || niveauxOf(c).includes(niveau as never))).map((c) => c.module))].sort((a, b) => a.localeCompare(b, "fr")),
    [all, filiere, niveau],
  );

  const filtered = useMemo(() => {
    const q = plain(search.trim());
    return all.filter((c) => {
      if (filiere && !filieresOf(c).includes(filiere)) return false;
      if (niveau && !niveauxOf(c).includes(niveau as never)) return false;
      if (module && c.module !== module) return false;
      if (!q) return true;
      return plain(`${c.titre} ${c.module} ${filieresOf(c).join(" ")} ${c.enseignant ?? ""} ${c.description ?? ""}`).includes(q);
    });
  }, [all, filiere, niveau, module, search]);

  // Regroupement : Filières › Niveaux. Un cours lié à L1 et L2 n'apparaît qu'une fois, sous « … › L1 + L2 ».
  const groups = useMemo(() => grouperCours(filtered), [filtered]);

  return (
    <section className="space-y-5">
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
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold sm:text-xl">
            <span className="h-5 w-1.5 rounded-full" style={{ background: COLOR }} />
            {titre} <span className="text-sm font-medium text-muted-foreground">({list.length})</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
            {list.map((c) => <CoursCard key={c.id} c={c} onOpen={() => setOuvert(c)} />)}
          </div>
        </div>
      ))}
      <Lecteur cours={ouvert} onClose={() => setOuvert(null)} />
    </section>
  );
}
