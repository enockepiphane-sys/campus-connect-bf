import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Search, CalendarDays, Building2, ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listOffres, favoriteIds, setFavorite, canManage } from "@/lib/opportunites";
import { CATEGORIES, deadlineState, type Opportunite } from "@/lib/opportunites-model";
import { OpportuniteDetails } from "./OpportuniteDetails";
export const offresQueryOptions = { queryKey: ["opportunites"], queryFn: () => listOffres() };
export function OpportunitesList() {
  const cache = useQueryClient(); const offres = useQuery(offresQueryOptions);
  const favorites = useQuery({ queryKey: ["opportunites-favoris"], queryFn: favoriteIds });
  const manager = useQuery({ queryKey: ["opportunites-management"], queryFn: canManage });
  const [search, setSearch] = useState(""); const [category, setCategory] = useState(""); const [onlyFav, setOnlyFav] = useState(false);
  const [selected, setSelected] = useState<Opportunite | null>(null); const [pending, setPending] = useState<string | null>(null); const [error, setError] = useState("");
  const ids = favorites.data ?? [];
  const filtered = (offres.data ?? []).filter(item => (!category || item.categorie === category) && (!onlyFav || ids.includes(item.id)) && `${item.titre} ${item.organisme} ${item.description}`.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr")));
  async function toggle(item: Opportunite) { setPending(item.id); setError(""); try { await setFavorite(item.id, !ids.includes(item.id)); await cache.invalidateQueries({ queryKey: ["opportunites-favoris"] }); } catch (err) { setError(err instanceof Error ? err.message : "Impossible d’enregistrer ce favori."); } finally { setPending(null); } }
  return <section className="mt-8 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-muted-foreground">Stages, emploi, bourses et prochaines candidatures.</p>{manager.data && <Button asChild variant="outline"><Link to="/gestion-opportunites">Gérer les offres<ArrowUpRight /></Link></Button>}</div>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Rechercher une opportunité" placeholder="Titre, organisme ou mot-clé" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      <select aria-label="Catégorie" value={category} onChange={e => setCategory(e.target.value)} className="h-9 max-w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Toutes les catégories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
      <Button variant={onlyFav ? "default" : "outline"} aria-pressed={onlyFav} onClick={() => setOnlyFav(v => !v)}><Bookmark />Mes favoris</Button>
    </div>
    {(error || offres.error || favorites.error) && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error || offres.error?.message || favorites.error?.message}</p><Button variant="outline" onClick={() => { void offres.refetch(); void favorites.refetch(); }}>Réessayer</Button></div>}
    {offres.isPending && <p role="status">Chargement des opportunités…</p>}
    {!offres.isPending && !offres.error && <p className="text-sm text-muted-foreground">{filtered.length} opportunité{filtered.length !== 1 ? "s" : ""}</p>}
    {!offres.isPending && !offres.error && filtered.length === 0 && <div className="py-12 text-center"><BriefcaseBusiness className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-xl font-semibold">Aucune opportunité trouvée</h2></div>}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(item => { const state = deadlineState(item.date_limite); const active = ids.includes(item.id); return <article key={item.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-2"><span className="text-xs font-semibold uppercase text-primary">{item.categorie}</span><Button variant="ghost" size="icon" title={active ? "Retirer des favoris" : "Enregistrer l’offre"} aria-label={active ? `Retirer ${item.titre} des favoris` : `Enregistrer ${item.titre}`} aria-pressed={active} disabled={pending !== null || favorites.isPending || Boolean(favorites.error)} onClick={() => void toggle(item)}><Bookmark fill={active ? "currentColor" : "none"} /></Button></div>
      <h2 className="break-words text-xl font-bold">{item.titre}</h2><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4 shrink-0" /><span className="break-words">{item.organisme}</span></p>
      <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.description}</p>
      <p className={`mt-5 flex flex-wrap items-center gap-2 text-sm ${state === "expired" ? "text-muted-foreground" : state === "soon" ? "text-destructive" : "text-primary"}`}><CalendarDays className="h-4 w-4" />{new Date(item.date_limite + "T12:00:00Z").toLocaleDateString("fr-FR", { dateStyle: "medium", timeZone: "UTC" })}<span>{state === "expired" ? "Clôturée" : state === "soon" ? "Clôture prochaine" : "Candidatures ouvertes"}</span></p>
      <Button variant="outline" className="mt-5" onClick={() => setSelected(item)}>Voir l’offre<ArrowUpRight /></Button>
    </article>; })}</div>
    <OpportuniteDetails offre={selected} onClose={() => setSelected(null)} />
  </section>;
}
