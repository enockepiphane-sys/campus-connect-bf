import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPin, ShoppingBag, Star } from "lucide-react";
import { formatPrix, listAnnonces, photoUrl } from "@/lib/marche";
import { estActif } from "@/lib/marche-monetisation";

// Carrousel automatique des dernières annonces du Marché mises « À la une ».
export function ALaUneDefilante() {
  const { data = [] } = useQuery({
    queryKey: ["marche-a-la-une-accueil"],
    queryFn: async () => (await listAnnonces()).filter((a) => estActif(a.a_la_une_jusqu)).slice(0, 10),
    staleTime: 5 * 60_000,
  });
  const [i, setI] = useState(0);

  useEffect(() => {
    if (data.length < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % data.length), 4500);
    return () => window.clearInterval(t);
  }, [data.length]);

  if (data.length === 0) return null;
  const a = data[i % data.length];

  return (
    <section data-guide="une" aria-label="Annonces à la une" className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <p className="flex items-center gap-1.5 px-4 pt-3 text-[11px] font-semibold uppercase tracking-widest text-primary"><Star className="h-3.5 w-3.5 fill-current" />À la une du Marché</p>
      <Link key={a.id} to="/marche" className="flex animate-in fade-in slide-in-from-right-6 duration-500 items-center gap-4 p-4">
        {a.photos[0] ? (
          <img src={photoUrl(a.photos[0])} alt="" className="h-20 w-24 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><ShoppingBag className="h-8 w-8" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{a.titre}</p>
          <p className="text-sm font-semibold text-primary">{formatPrix(a.prix, a.type_annonce)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{a.ville} · {a.categorie}</p>
        </div>
      </Link>
      {data.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1.5">
          {data.map((x, k) => (
            <button key={x.id} type="button" aria-label={`Annonce ${k + 1}`} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i % data.length ? "w-5 bg-primary" : "w-1.5 bg-foreground/25"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
