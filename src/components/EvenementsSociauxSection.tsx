import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { LoaderInline } from "@/components/ChargementPremium";
import { DateSticker, Poster, StatusChip, useEvents } from "@/components/evenements-shared";

// Vitrine « À l'affiche » de l'accueil : carrousel d'affiches, qui mène à la page Événements.
export function EvenementsSociauxSection() {
  const { loading, upcoming, past } = useEvents();
  const track = useRef<HTMLDivElement>(null);
  const shown = (upcoming.length ? upcoming : past).slice(0, 8);
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section aria-labelledby="evenements-sociaux-titre" className="mx-auto mt-16 max-w-6xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <PartyPopper className="h-4 w-4" />
            À l’affiche
          </p>
          <h2 id="evenements-sociaux-titre" className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Événements sociaux
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!loading && shown.length > 1 && (
            <div className="hidden gap-1.5 sm:flex">
              <button type="button" aria-label="Précédent" onClick={() => scroll(-1)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface transition hover:bg-muted">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Suivant" onClick={() => scroll(1)} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface transition hover:bg-muted">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
          <Link to="/evenements" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
            Tout voir
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-border bg-surface p-8">
          <LoaderInline label="Chargement des événements…" />
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-surface p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <CalendarDays className="h-7 w-7" />
          </span>
          <h3 className="mt-3 font-display text-lg font-bold">Les prochains événements arrivent</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Aucun événement programmé pour le moment. Revenez bientôt.</p>
        </div>
      )}

      {!loading && shown.length > 0 && (
        <div ref={track} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {shown.map(({ ev, date, status, img }) => (
            <Link
              key={ev.id}
              to="/evenements"
              hash={ev.id}
              className="group relative isolate block aspect-[3/4] w-[62vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-3xl shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[240px]"
            >
              <Poster src={img} titre={ev.titre} className="absolute inset-0 -z-10 h-full w-full" />
              <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="pointer-events-none absolute left-3 top-3">
                <DateSticker date={date} muted={status.past} />
              </div>
              <div className="pointer-events-none absolute right-3 top-3">
                <StatusChip status={status} />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug">{ev.titre}</h3>
                {date && <p className="mt-1 text-xs font-medium text-white/80">{date.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>}
              </div>
            </Link>
          ))}
          <Link
            to="/evenements"
            className="grid aspect-[3/4] w-[44vw] max-w-[200px] shrink-0 snap-start place-items-center rounded-3xl border-2 border-dashed border-border text-center transition hover:bg-muted sm:w-[180px]"
          >
            <span className="px-4">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <ArrowRight className="h-5 w-5" />
              </span>
              <span className="mt-3 block font-display font-bold">Voir tous les événements</span>
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
