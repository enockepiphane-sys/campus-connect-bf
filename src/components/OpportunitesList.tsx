import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Search, CalendarDays, Building2, ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listOffres, favoriteIds, setFavorite, canManage } from "@/lib/opportunites";
import { CATEGORIES, deadlineState, type Opportunite } from "@/lib/opportunites-model";
import { OpportuniteDetails } from "./OpportuniteDetails";
import { imageUrl } from "@/lib/images-contenu";
export const offresQueryOptions = { queryKey: ["opportunites"], queryFn: () => listOffres() };

// Une couleur par catégorie pour un repérage immédiat.
const CATEGORY_COLORS: Record<string, string> = {
  "Stages": "#167d78",
  "Offres d'emploi": "#ea580c",
  "Bourses d'études": "#0F8A44",
  "Concours": "#c08a1e",
  "Formations": "#2b3a33",
  "Appels à candidatures": "#c2603c",
};
const colorOf = (categorie: string) => CATEGORY_COLORS[categorie] ?? "#ea580c";

export function OpportunitesList() {
  const cache = useQueryClient();
  const offres = useQuery(offresQueryOptions);
  // Les offres sont visibles par tous. Favoris et gestion ne concernent que les personnes connectées.
  const session = useQuery({
    queryKey: ["opportunites-session"],
    queryFn: async () => Boolean((await supabase.auth.getSession()).data.session),
  });
  const signedIn = session.data === true;
  const favorites = useQuery({ queryKey: ["opportunites-favoris"], queryFn: favoriteIds, enabled: signedIn });
  const manager = useQuery({ queryKey: ["opportunites-management"], queryFn: canManage, enabled: signedIn });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const [selected, setSelected] = useState<Opportunite | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ids = favorites.data ?? [];
  const filtered = (offres.data ?? []).filter(
    (item) =>
      (!category || item.categorie === category) &&
      (!onlyFav || ids.includes(item.id)) &&
      `${item.titre} ${item.organisme} ${item.description}`.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr")),
  );
  async function toggle(item: Opportunite) {
    setPending(item.id);
    setError("");
    try {
      await setFavorite(item.id, !ids.includes(item.id));
      await cache.invalidateQueries({ queryKey: ["opportunites-favoris"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’enregistrer ce favori.");
    } finally {
      setPending(null);
    }
  }
  return (
    <section className="space-y-6">
      {manager.data && (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to="/gestion-opportunites">
              Gérer les offres
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Rechercher une opportunité"
              placeholder="Titre, organisme ou mot-clé"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
          {signedIn && (
            <Button variant={onlyFav ? "default" : "outline"} className="h-10" aria-pressed={onlyFav} onClick={() => setOnlyFav((v) => !v)}>
              <Bookmark />
              Mes favoris
            </Button>
          )}
        </div>
        <div role="group" aria-label="Catégorie" className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={category === ""}
            onClick={() => setCategory("")}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              category === "" ? "border-transparent bg-foreground text-background" : "border-border bg-surface text-foreground/80 hover:bg-muted"
            }`}
          >
            Toutes
          </button>
          {CATEGORIES.map((c) => {
            const active = category === c;
            const col = colorOf(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(active ? "" : c)}
                className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:brightness-95"
                style={active ? { background: col, borderColor: col, color: "#fff" } : { background: `${col}14`, borderColor: `${col}55`, color: col }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {(error || offres.error || favorites.error) && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{error || offres.error?.message || favorites.error?.message}</p>
          <Button
            variant="outline"
            onClick={() => {
              void offres.refetch();
              void favorites.refetch();
            }}
          >
            Réessayer
          </Button>
        </div>
      )}
      {offres.isPending && <p role="status">Chargement des opportunités…</p>}
      {!offres.isPending && !offres.error && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} opportunité{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
      {!offres.isPending && !offres.error && filtered.length === 0 && (
        <div className="py-12 text-center">
          <BriefcaseBusiness className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Aucune opportunité trouvée</h2>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
        {filtered.map((item) => {
          const state = deadlineState(item.date_limite);
          const active = ids.includes(item.id);
          const col = colorOf(item.categorie);
          return (
            <article
              key={item.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="h-1.5" style={{ background: col }} />
              {imageUrl(item.image_path) && <img src={imageUrl(item.image_path) ?? ""} alt="" loading="lazy" className="aspect-video w-full bg-muted/40 object-contain" />}
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-[11px]" style={{ background: `${col}1f`, color: col }}>
                    {item.categorie}
                  </span>
                  {signedIn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title={active ? "Retirer des favoris" : "Enregistrer l’offre"}
                      aria-label={active ? `Retirer ${item.titre} des favoris` : `Enregistrer ${item.titre}`}
                      aria-pressed={active}
                      disabled={pending !== null || favorites.isPending || Boolean(favorites.error)}
                      onClick={() => void toggle(item)}
                    >
                      <Bookmark fill={active ? "currentColor" : "none"} />
                    </Button>
                  )}
                </div>
                <h2 className="line-clamp-2 break-words font-display text-sm font-bold leading-snug sm:text-base">{item.titre}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1 break-words">{item.organisme}</span>
                </p>
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground sm:text-[13px]">{item.description}</p>
                <p
                  className={`mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-medium ${
                    state === "expired" ? "text-muted-foreground" : state === "soon" ? "text-destructive" : "text-primary"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(item.date_limite + "T12:00:00Z").toLocaleDateString("fr-FR", { dateStyle: "medium", timeZone: "UTC" })}
                  <span>{state === "expired" ? "Clôturée" : state === "soon" ? "Clôture prochaine" : "Candidatures ouvertes"}</span>
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full text-white hover:brightness-110"
                  style={{ background: col }}
                  onClick={() => setSelected(item)}
                >
                  Voir l’offre
                  <ArrowUpRight />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <OpportuniteDetails offre={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
