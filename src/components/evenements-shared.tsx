import { useQuery } from "@tanstack/react-query";
import { ImageIcon, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AFFICHES_SOCIALES_BUCKET = "affiches-evenements-sociaux";
export const MOIS_COURTS = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];

export type EvenementSocial = {
  id: string;
  titre: string;
  description: string | null;
  affiche_url: string | null;
  lien: string | null;
  date_evenement: string | null;
};

export type EventItem = {
  ev: EvenementSocial;
  date: Date | null;
  status: { label: string; past: boolean; hot: boolean; days: number | null };
  img: string | null;
};

export function safeLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function statusOf(date: Date | null, now: Date): EventItem["status"] {
  if (!date) return { label: "Date à annoncer", past: false, hot: false, days: null };
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
  if (days < 0) return { label: "Terminé", past: true, hot: false, days };
  if (days === 0) return { label: "Aujourd’hui", past: false, hot: true, days };
  if (days === 1) return { label: "Demain", past: false, hot: true, days };
  return { label: `Dans ${days} jours`, past: false, hot: days <= 7, days };
}

async function fetchEvents(): Promise<EventItem[]> {
  const { data } = await supabase
    .from("evenements_sociaux")
    .select("id,titre,description,affiche_url,lien,date_evenement")
    .eq("actif", true)
    .is("deleted_at", null)
    .order("date_evenement", { ascending: true, nullsFirst: false });
  const rows = (data as EvenementSocial[]) ?? [];
  const now = new Date();
  return rows.map((ev) => {
    const parsed = ev.date_evenement ? new Date(ev.date_evenement) : null;
    const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    const img = ev.affiche_url ? (supabase.storage.from(AFFICHES_SOCIALES_BUCKET).getPublicUrl(ev.affiche_url).data.publicUrl ?? null) : null;
    return { ev, date, status: statusOf(date, now), img };
  });
}

export function useEvents() {
  const query = useQuery({ queryKey: ["evenements-sociaux"], queryFn: fetchEvents, staleTime: 60_000 });
  const items = query.data ?? [];
  const upcoming = items.filter((i) => !i.status.past).sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));
  const past = items.filter((i) => i.status.past).sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  return { loading: query.isPending, items, upcoming, past };
}

export async function shareEvent(titre: string, lien: string | null) {
  const url = lien ?? window.location.origin + "/evenements";
  try {
    if (navigator.share) await navigator.share({ title: titre, text: `${titre} — CampusLink`, url });
    else await navigator.clipboard.writeText(url);
  } catch {
    /* partage annulé */
  }
}

// « Sticker » de date : bandeau doré avec le mois, gros chiffre pour le jour.
export function DateSticker({ date, large = false, muted = false }: { date: Date | null; large?: boolean; muted?: boolean }) {
  return (
    <div className={`-rotate-3 overflow-hidden rounded-2xl bg-white text-center text-neutral-900 shadow-lg ring-1 ring-black/10 ${large ? "w-24" : "w-16"} ${muted ? "grayscale" : ""}`}>
      <div className={`bg-[#F0C419] font-bold tracking-widest text-neutral-900 ${large ? "py-1.5 text-xs" : "py-1 text-[10px]"}`}>{date ? MOIS_COURTS[date.getMonth()] : "BIENTÔT"}</div>
      <div className={`font-display font-bold tabular-nums leading-none ${large ? "py-3 text-5xl" : "py-2 text-3xl"}`}>{date ? String(date.getDate()).padStart(2, "0") : "—"}</div>
    </div>
  );
}

export function StatusChip({ status }: { status: EventItem["status"] }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide shadow ${status.past ? "bg-neutral-800/85 text-white" : status.hot ? "bg-[#ea580c] text-white" : "bg-white/95 text-neutral-900"}`}>
      {status.label}
    </span>
  );
}

// Affiche cliquable (ou visuel de remplacement quand il n'y a pas d'affiche).
export function Poster({ src, titre, onZoom, className = "" }: { src: string | null; titre: string; onZoom?: (src: string, titre: string) => void; className?: string }) {
  if (!src) {
    return (
      <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: "linear-gradient(135deg, #052e1c 0%, #0b6b36 55%, #12A150 100%)" }}>
        <span aria-hidden className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/15" />
        <PartyPopper aria-hidden className="h-14 w-14 text-white/70" strokeWidth={1.3} />
      </div>
    );
  }
  const image = <img src={src} alt={`Affiche de l'événement ${titre}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover/poster:scale-105" />;
  if (!onZoom) return <div className={`relative overflow-hidden bg-muted ${className}`}>{image}</div>;
  return (
    <button type="button" onClick={() => onZoom(src, titre)} aria-label={`Agrandir l’affiche de ${titre}`} className={`group/poster relative block overflow-hidden bg-muted ${className}`}>
      {image}
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white opacity-0 transition group-hover/poster:opacity-100 group-focus-visible/poster:opacity-100">
        <ImageIcon className="h-3.5 w-3.5" />
        Agrandir l’affiche
      </span>
    </button>
  );
}
