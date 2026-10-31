import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock, PartyPopper, Search, Share2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoaderInline } from "@/components/ChargementPremium";
import { DateSticker, Poster, StatusChip, safeLink, shareEvent, useEvents, type EventItem } from "@/components/evenements-shared";

type Filter = "avenir" | "semaine" | "mois" | "passes" | "tous";
const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function monthLabel(date: Date | null) {
  return date ? cap(date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })) : "Date à annoncer";
}

function Actions({ item }: { item: EventItem }) {
  const href = safeLink(item.ev.lien);
  return (
    <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
          Voir l’événement
          <ArrowUpRight className="h-4 w-4" />
        </a>
      )}
      <button type="button" onClick={() => void shareEvent(item.ev.titre, href)} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted">
        <Share2 className="h-4 w-4" />
        Partager
      </button>
    </div>
  );
}

function Featured({ item, onZoom }: { item: EventItem; onZoom: (src: string, titre: string) => void }) {
  const { ev, date, status, img } = item;
  return (
    <article id={ev.id} className="scroll-mt-24 grid overflow-hidden rounded-3xl border border-border bg-surface shadow-xl md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative">
        <Poster src={img} titre={ev.titre} onZoom={onZoom} className="aspect-[4/5] w-full md:aspect-auto md:h-full md:min-h-[440px]" />
        <div className="pointer-events-none absolute left-4 top-4">
          <DateSticker date={date} large />
        </div>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F0C419] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-neutral-900">À ne pas manquer</span>
          <StatusChip status={status} />
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{ev.titre}</h2>
        {date && (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <CalendarDays className="h-4 w-4" />
            {date.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
          </p>
        )}
        {ev.description && <p className="mt-4 line-clamp-6 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{ev.description}</p>}
        <Actions item={item} />
      </div>
    </article>
  );
}

function AgendaRow({ item, onZoom, highlighted }: { item: EventItem; onZoom: (src: string, titre: string) => void; highlighted: boolean }) {
  const { ev, date, status, img } = item;
  return (
    <article
      id={ev.id}
      className={`scroll-mt-24 flex flex-col overflow-hidden rounded-3xl border bg-surface shadow-sm transition duration-300 hover:shadow-lg sm:flex-row ${highlighted ? "border-primary ring-2 ring-primary" : "border-border"} ${status.past ? "opacity-85" : ""}`}
    >
      <div className="relative sm:w-48 sm:shrink-0">
        <Poster src={img} titre={ev.titre} onZoom={onZoom} className="aspect-[4/5] w-full sm:h-full sm:min-h-[230px] sm:aspect-auto" />
        <div className="pointer-events-none absolute left-3 top-3">
          <DateSticker date={date} muted={status.past} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="mb-2">
          <StatusChip status={status} />
        </div>
        <h3 className="break-words font-display text-xl font-bold leading-snug sm:text-2xl">{ev.titre}</h3>
        {date && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            {date.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {ev.description && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{ev.description}</p>}
        <Actions item={item} />
      </div>
    </article>
  );
}

export function EvenementsPage() {
  const { loading, items, upcoming, past } = useEvents();
  const [filter, setFilter] = useState<Filter>("avenir");
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState<{ src: string; titre: string } | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const inWeek = (i: EventItem) => i.status.days !== null && i.status.days >= 0 && i.status.days <= 7;
  const inMonth = (i: EventItem) => !!i.date && !i.status.past && i.date.getMonth() === now.getMonth() && i.date.getFullYear() === now.getFullYear();

  const counts: Record<Filter, number> = {
    avenir: upcoming.length,
    semaine: upcoming.filter(inWeek).length,
    mois: upcoming.filter(inMonth).length,
    passes: past.length,
    tous: items.length,
  };

  const base = filter === "avenir" ? upcoming : filter === "semaine" ? upcoming.filter(inWeek) : filter === "mois" ? upcoming.filter(inMonth) : filter === "passes" ? past : [...upcoming, ...past];
  const q = plain(search.trim());
  const list = q ? base.filter((i) => plain(`${i.ev.titre} ${i.ev.description ?? ""}`).includes(q)) : base;

  const featured = !q && (filter === "avenir" || filter === "tous") ? upcoming[0] : undefined;
  const rest = featured ? list.filter((i) => i !== featured) : list;

  const groups: { label: string; items: EventItem[] }[] = [];
  for (const it of rest) {
    const label = monthLabel(it.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }

  // Lien direct vers un événement (depuis l'accueil) : on le montre et on le met en valeur.
  useEffect(() => {
    if (loading || !items.length) return;
    const id = window.location.hash.replace("#", "");
    const target = items.find((i) => i.ev.id === id);
    if (!target) return;
    if (target.status.past) setFilter("passes");
    setHighlight(id);
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    return () => clearTimeout(t);
  }, [loading, items]);

  const pills: { k: Filter; l: string }[] = [
    { k: "avenir", l: "À venir" },
    { k: "semaine", l: "Cette semaine" },
    { k: "mois", l: "Ce mois-ci" },
    { k: "passes", l: "Passés" },
    { k: "tous", l: "Tous" },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Rechercher un événement" placeholder="Rechercher un événement…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 rounded-2xl pl-12 pr-10 text-base" />
          {search && (
            <button type="button" aria-label="Effacer la recherche" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Période" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {pills.map((p) => (
            <button
              key={p.k}
              type="button"
              aria-pressed={filter === p.k}
              onClick={() => setFilter(p.k)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${filter === p.k ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-surface text-foreground/80 hover:bg-muted"}`}
            >
              {p.l} <span className={filter === p.k ? "opacity-80" : "text-muted-foreground"}>({counts[p.k]})</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-border bg-surface p-8">
          <LoaderInline label="Chargement des événements…" />
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border py-14 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
            <PartyPopper className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold">{items.length ? "Aucun événement trouvé" : "Les prochains événements arrivent"}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {items.length ? "Essayez une autre période ou un autre mot." : "Aucun événement n’est programmé pour le moment. Revenez bientôt."}
          </p>
        </div>
      )}

      {featured && <Featured item={featured} onZoom={(src, titre) => setZoom({ src, titre })} />}

      {groups.map((g) => (
        <div key={g.label} className="space-y-4">
          <h2 className="flex items-center gap-3 font-display text-xl font-bold sm:text-2xl">
            <span className="h-7 w-1.5 rounded-full bg-[#ea580c]" />
            {g.label}
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{g.items.length}</span>
          </h2>
          <div className="space-y-5">
            {g.items.map((it) => (
              <AgendaRow key={it.ev.id} item={it} onZoom={(src, titre) => setZoom({ src, titre })} highlighted={highlight === it.ev.id} />
            ))}
          </div>
        </div>
      ))}

      <Dialog open={Boolean(zoom)} onOpenChange={(open) => !open && setZoom(null)}>
        <DialogContent className="max-h-[92dvh] w-auto max-w-[95vw] overflow-auto border-0 bg-transparent p-0 shadow-none sm:max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{zoom?.titre}</DialogTitle>
            <DialogDescription>Affiche de l’événement en grand format</DialogDescription>
          </DialogHeader>
          {zoom && <img src={zoom.src} alt={`Affiche de l'événement ${zoom.titre}`} className="mx-auto max-h-[88dvh] w-auto max-w-full rounded-2xl object-contain" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
