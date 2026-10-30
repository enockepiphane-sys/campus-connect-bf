import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock, ImageIcon, PartyPopper, Share2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoaderInline } from "@/components/ChargementPremium";
import { supabase } from "@/integrations/supabase/client";

const AFFICHES_SOCIALES_BUCKET = "affiches-evenements-sociaux";

type EvenementSocial = {
  id: string;
  titre: string;
  description: string | null;
  affiche_url: string | null;
  lien: string | null;
  date_evenement: string | null;
};

const MOIS_COURTS = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];

function safeLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Statut lisible : Terminé / Aujourd'hui / Demain / Dans N jours / Date à venir.
function statusOf(date: Date | null, now: Date): { label: string; past: boolean; hot: boolean } {
  if (!date) return { label: "Date à venir", past: false, hot: false };
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  if (days < 0) return { label: "Terminé", past: true, hot: false };
  if (days === 0) return { label: "Aujourd’hui", past: false, hot: true };
  if (days === 1) return { label: "Demain", past: false, hot: true };
  return { label: `Dans ${days} jours`, past: false, hot: days <= 7 };
}

// « Sticker » de date : bandeau doré avec le mois, gros chiffre pour le jour.
function DateSticker({ date, large = false, muted = false }: { date: Date | null; large?: boolean; muted?: boolean }) {
  return (
    <div
      className={`-rotate-3 overflow-hidden rounded-2xl bg-white text-center text-neutral-900 shadow-lg ring-1 ring-black/10 ${large ? "w-24" : "w-16"} ${muted ? "grayscale" : ""}`}
    >
      <div className={`bg-[#F0C419] font-bold tracking-widest text-neutral-900 ${large ? "py-1.5 text-xs" : "py-1 text-[10px]"}`}>
        {date ? MOIS_COURTS[date.getMonth()] : "BIENTÔT"}
      </div>
      <div className={`font-display font-bold tabular-nums leading-none ${large ? "py-3 text-5xl" : "py-2 text-3xl"}`}>
        {date ? String(date.getDate()).padStart(2, "0") : "—"}
      </div>
    </div>
  );
}

function Poster({
  src,
  titre,
  onZoom,
  className = "",
}: {
  src: string | null;
  titre: string;
  onZoom: (src: string, titre: string) => void;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`relative grid place-items-center overflow-hidden ${className}`}
        style={{ background: "linear-gradient(135deg, #052e1c 0%, #0b6b36 55%, #12A150 100%)" }}
      >
        <span aria-hidden className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/15" />
        <PartyPopper aria-hidden className="h-16 w-16 text-white/70" strokeWidth={1.3} />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onZoom(src, titre)}
      aria-label={`Agrandir l’affiche de ${titre}`}
      className={`group/poster relative block overflow-hidden bg-muted ${className}`}
    >
      <img
        src={src}
        alt={`Affiche de l'événement ${titre}`}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover/poster:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white opacity-0 transition group-hover/poster:opacity-100 group-focus-visible/poster:opacity-100">
        <ImageIcon className="h-3.5 w-3.5" />
        Agrandir l’affiche
      </span>
    </button>
  );
}

export function EvenementsSociauxSection() {
  const [list, setList] = useState<EvenementSocial[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [zoom, setZoom] = useState<{ src: string; titre: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("evenements_sociaux")
        .select("id,titre,description,affiche_url,lien,date_evenement")
        .eq("actif", true)
        .is("deleted_at", null)
        .order("date_evenement", { ascending: true, nullsFirst: false });
      const rows = (data as EvenementSocial[]) ?? [];
      setList(rows);
      const map: Record<string, string> = {};
      for (const r of rows) {
        if (r.affiche_url) {
          const { data: pub } = supabase.storage.from(AFFICHES_SOCIALES_BUCKET).getPublicUrl(r.affiche_url);
          if (pub?.publicUrl) map[r.affiche_url] = pub.publicUrl;
        }
      }
      setUrls(map);
      setLoading(false);
    })();
  }, []);

  const now = useMemo(() => new Date(), []);
  const items = useMemo(
    () =>
      list.map((ev) => {
        const date = ev.date_evenement ? new Date(ev.date_evenement) : null;
        const valid = date && !Number.isNaN(date.getTime()) ? date : null;
        return { ev, date: valid, status: statusOf(valid, now), img: ev.affiche_url ? (urls[ev.affiche_url] ?? null) : null };
      }),
    [list, urls, now],
  );
  const upcoming = items.filter((i) => !i.status.past);
  const past = items.filter((i) => i.status.past).reverse();
  const featured = upcoming[0];
  const others = upcoming.slice(1);

  async function share(titre: string, lien: string | null) {
    const url = lien ?? window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: titre, text: `${titre} — CampusLink`, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* partage annulé */
    }
  }

  function card(item: (typeof items)[number], dim = false) {
    const { ev, date, status, img } = item;
    const href = safeLink(ev.lien);
    return (
      <article
        key={ev.id}
        className={`group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${dim ? "opacity-80" : ""}`}
      >
        <div className="relative">
          <Poster src={img} titre={ev.titre} onZoom={(src, titre) => setZoom({ src, titre })} className="aspect-[4/5] w-full" />
          <div className="pointer-events-none absolute left-3 top-3">
            <DateSticker date={date} muted={status.past} />
          </div>
          <span
            className={`pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow ${
              status.past ? "bg-neutral-800/85 text-white" : status.hot ? "bg-[#ea580c] text-white" : "bg-white/95 text-neutral-900"
            }`}
          >
            {status.label}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-xl font-bold leading-snug text-foreground">{ev.titre}</h3>
          {date && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {date.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {ev.description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{ev.description}</p>}
          <div className="mt-auto flex items-center gap-2 pt-5">
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Voir l’événement
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => void share(ev.titre, href)}
              aria-label={`Partager ${ev.titre}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition hover:bg-muted"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <section aria-labelledby="evenements-sociaux-titre" className="mx-auto mt-20 max-w-6xl">
      {/* Bandeau d'en-tête */}
      <div
        className="relative isolate overflow-hidden rounded-[2rem] px-6 pb-20 pt-10 text-white sm:px-12 sm:pb-24 sm:pt-14"
        style={{ background: "linear-gradient(135deg, #052e1c 0%, #0b6b36 55%, #12A150 100%)" }}
      >
        <div aria-hidden className="kente-stripe absolute inset-x-0 top-0 h-1.5" />
        <span aria-hidden className="absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-24 left-1/4 -z-10 h-60 w-60 rounded-full bg-black/15" />
        <PartyPopper aria-hidden strokeWidth={1} className="absolute -bottom-6 right-4 -z-10 h-56 w-56 text-white/10" />
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#F0C419]">
          <Sparkles className="h-4 w-4" />
          À l’affiche
        </p>
        <h2 id="evenements-sociaux-titre" className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Événements sociaux
        </h2>
        <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
          Concerts, conférences, rencontres et activités organisés par nos partenaires : le rendez-vous de la vie étudiante au Burkina Faso.
        </p>
        {!loading && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#F0C419] px-4 py-1.5 text-sm font-bold text-neutral-900">
              {upcoming.length} événement{upcoming.length > 1 ? "s" : ""} à venir
            </span>
            {past.length > 0 && (
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">{past.length} passé{past.length > 1 ? "s" : ""}</span>
            )}
          </div>
        )}
      </div>

      {/* Contenu qui chevauche le bandeau */}
      <div className="relative z-10 -mt-12 px-3 sm:-mt-14 sm:px-8">
        {loading && (
          <div className="rounded-3xl border border-border bg-surface p-8 shadow-lg">
            <LoaderInline label="Chargement des événements…" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-lg">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
              <CalendarDays className="h-8 w-8" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold">Les prochains événements arrivent</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Aucun événement n’est programmé pour le moment. Revenez bientôt pour découvrir les rendez-vous de nos partenaires.
            </p>
          </div>
        )}

        {/* Événement à la une */}
        {featured && (
          <article className="grid overflow-hidden rounded-3xl border border-border bg-surface shadow-xl md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <div className="relative">
              <Poster
                src={featured.img}
                titre={featured.ev.titre}
                onZoom={(src, titre) => setZoom({ src, titre })}
                className="aspect-[4/5] w-full md:aspect-auto md:h-full md:min-h-[460px]"
              />
              <div className="pointer-events-none absolute left-4 top-4 sm:left-5 sm:top-5">
                <DateSticker date={featured.date} large />
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F0C419] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-neutral-900">
                  Prochain événement
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    featured.status.hot ? "bg-[#ea580c] text-white" : "bg-primary-soft text-primary"
                  }`}
                >
                  {featured.status.label}
                </span>
              </div>
              <h3 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
                {featured.ev.titre}
              </h3>
              {featured.date && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <CalendarDays className="h-4 w-4" />
                  {featured.date.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
                </p>
              )}
              {featured.ev.description && (
                <p className="mt-4 line-clamp-6 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{featured.ev.description}</p>
              )}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {safeLink(featured.ev.lien) && (
                  <a
                    href={safeLink(featured.ev.lien)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-bf-primary rounded-full px-6"
                  >
                    Voir l’événement
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void share(featured.ev.titre, safeLink(featured.ev.lien))}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </button>
              </div>
            </div>
          </article>
        )}

        {/* Les autres événements à venir */}
        {others.length > 0 && (
          <>
            <h3 className="mb-4 mt-10 flex items-center gap-3 font-display text-xl font-bold">
              <span className="h-6 w-1.5 rounded-full bg-[#ea580c]" />
              Et aussi à venir
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((item) => card(item))}
            </div>
          </>
        )}

        {/* Événements passés */}
        {past.length > 0 && (
          <div className="mt-10">
            <button
              type="button"
              aria-expanded={showPast}
              onClick={() => setShowPast((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              {showPast ? "Masquer" : "Voir"} les événements passés ({past.length})
            </button>
            {showPast && (
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((item) => card(item, true))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Affiche en grand */}
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
