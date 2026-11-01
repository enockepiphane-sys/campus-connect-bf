import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listGuide, type GuideArticle } from "@/lib/guide";

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const COLOR = "#1d6fa5";

function Fiche({ a, index }: { a: GuideArticle; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: COLOR }}>{index + 1}</span>
        <span className="flex-1 font-display text-base font-bold sm:text-lg">{a.titre}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{a.contenu}</p>
          {a.lien && (
            <a href={a.lien} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110" style={{ background: COLOR }}>
              Ouvrir le site officiel <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export function GuideList() {
  const guide = useQuery({ queryKey: ["guide-articles"], queryFn: () => listGuide(false) });
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const all = guide.data ?? [];
  const categories = [...new Set(all.map((a) => a.categorie))];

  const filtered = useMemo(() => {
    const q = plain(search.trim());
    return all.filter((a) => (!cat || a.categorie === cat) && (!q || plain(`${a.titre} ${a.contenu} ${a.categorie}`).includes(q)));
  }, [all, search, cat]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Rechercher dans le guide" placeholder="Ex. : créer mon compte, orientation, bulletin…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 rounded-2xl pl-12 pr-10 text-base" />
          {search && (
            <button type="button" aria-label="Effacer" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
          )}
        </div>
        <div role="group" aria-label="Étapes" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["", ...categories].map((c) => (
            <button key={c || "tout"} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${cat === c ? "border-transparent text-white" : "border-border text-foreground/75 hover:bg-muted"}`}
              style={cat === c ? { background: COLOR } : undefined}>
              {c || "Tout le guide"}
            </button>
          ))}
        </div>
      </div>

      {guide.isPending && <p role="status" className="text-center text-muted-foreground">Chargement du guide…</p>}
      {guide.error && <p role="alert" className="rounded-2xl border border-destructive/30 p-6 text-center text-destructive">{(guide.error as Error).message}</p>}
      {!guide.isPending && !guide.error && !filtered.length && <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Aucune fiche ne correspond à ta recherche.</p>}

      {categories.filter((c) => filtered.some((a) => a.categorie === c)).map((c) => (
        <div key={c}>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
            <span className="h-6 w-1.5 rounded-full" style={{ background: COLOR }} />{c}
          </h2>
          <div className="space-y-3">
            {filtered.filter((a) => a.categorie === c).map((a, i) => <Fiche key={a.id} a={a} index={i} />)}
          </div>
        </div>
      ))}

      <p className="text-center text-xs text-muted-foreground">
        Les démarches officielles se font uniquement sur www.campusfaso.bf. Les dates et conditions peuvent changer chaque année : vérifie toujours les communiqués officiels.
      </p>
    </section>
  );
}
