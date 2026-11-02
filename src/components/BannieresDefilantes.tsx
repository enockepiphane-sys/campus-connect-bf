import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Megaphone, Phone } from "lucide-react";
import { banniereImage, listBannieresActives } from "@/lib/marche-monetisation";

// Carrousel automatique des bannières publicitaires vendues (imprimeries, cybercafés, résidences…).
export function BannieresDefilantes({ className = "" }: { className?: string }) {
  const { data = [] } = useQuery({ queryKey: ["marche-bannieres-actives"], queryFn: listBannieresActives, staleTime: 5 * 60_000 });
  const [i, setI] = useState(0);

  useEffect(() => {
    if (data.length < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % data.length), 5000);
    return () => window.clearInterval(t);
  }, [data.length]);

  if (data.length === 0) return null;
  const b = data[i % data.length];

  return (
    <section aria-label="Partenaires CampusLink" className={`relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm ${className}`}>
      <div key={b.id} className="flex animate-in fade-in slide-in-from-right-6 duration-500 items-center gap-4 p-4 sm:p-5">
        {b.image_path ? (
          <img src={banniereImage(b.image_path)} alt="" className="h-20 w-28 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-40" />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Megaphone className="h-8 w-8" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Partenaire</p>
          <p className="truncate font-display text-lg font-bold">{b.annonceur}</p>
          <p className="line-clamp-2 text-sm text-foreground/80">{b.message}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-primary">
            {b.telephone && <a href={`tel:${b.telephone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{b.telephone}</a>}
            {b.lien && <a href={b.lien} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-1"><ExternalLink className="h-4 w-4" />Découvrir</a>}
          </div>
        </div>
      </div>
      {data.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1.5">
          {data.map((x, k) => (
            <button key={x.id} type="button" aria-label={`Bannière ${k + 1}`} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i % data.length ? "w-5 bg-primary" : "w-1.5 bg-foreground/25"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
