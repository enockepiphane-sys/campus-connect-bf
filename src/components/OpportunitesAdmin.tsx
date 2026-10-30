import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { listOffres, canManage, saveOffre, deleteOffre } from "@/lib/opportunites";
import { CATEGORIES, type OffreInput, type Opportunite } from "@/lib/opportunites-model";
function emptyForm(): OffreInput { return { titre: "", organisme: "", description: "", conditions: "", categorie: "Stages", date_limite: "", candidature: "", publie: false }; }
export function OpportunitesAdmin() {
  const cache = useQueryClient(); const access = useQuery({ queryKey: ["opportunites-management"], queryFn: canManage });
  const offres = useQuery({ queryKey: ["opportunites-admin"], queryFn: () => listOffres(true), enabled: access.data === true });
  const [form, setForm] = useState<OffreInput>(emptyForm); const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false); const [deleting, setDeleting] = useState<Opportunite | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  async function refresh() { await Promise.all([cache.invalidateQueries({ queryKey: ["opportunites-admin"] }), cache.invalidateQueries({ queryKey: ["opportunites"] }), cache.invalidateQueries({ queryKey: ["opportunites-favoris"] })]); }
  function start(item?: Opportunite) { setError(""); setMessage(""); setEditing(item?.id ?? null); setForm(item ? { titre: item.titre, organisme: item.organisme, description: item.description, conditions: item.conditions, categorie: item.categorie, date_limite: item.date_limite, candidature: item.candidature, publie: item.publie } : emptyForm()); setShowForm(true); }
  if (access.isPending) return <p role="status">Vérification des autorisations…</p>;
  if (access.error) return <div role="alert"><p className="text-destructive">{access.error.message}</p><Button variant="outline" onClick={() => void access.refetch()}>Réessayer</Button></div>;
  if (!access.data) return <p role="alert" className="py-8 text-destructive">Vous n’avez pas l’autorisation de gérer les offres.</p>;
  return <section className="mt-6 space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Publication des opportunités</h2><Button disabled={busy} onClick={() => start()}><Plus />Nouvelle offre</Button></div>
    {(error || offres.error) && <p role="alert" className="text-destructive">{error || offres.error?.message}</p>}{message && <p role="status" className="text-primary">{message}</p>}
    {showForm && <form className="space-y-5 border-y border-border py-6" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); setMessage(""); try { await saveOffre(form, editing ?? undefined); setShowForm(false); await refresh(); setMessage("L’offre a été enregistrée."); } catch (err) { setError(err instanceof Error ? err.message : "Enregistrement impossible."); } finally { setBusy(false); } }}>
      <div className="grid gap-4 sm:grid-cols-2">{([ ["titre", "Titre", 200], ["organisme", "Organisme", 200] ] as const).map(([field, label, max]) => <div key={field} className="space-y-2"><Label htmlFor={`offre-${field}`}>{label}</Label><Input id={`offre-${field}`} required maxLength={max} disabled={busy} value={form[field]} onChange={e => setForm(v => ({ ...v, [field]: e.target.value }))} /></div>)}
        <div className="space-y-2"><Label htmlFor="offre-category">Catégorie</Label><select id="offre-category" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={busy} value={form.categorie} onChange={e => { const value = CATEGORIES.find(c => c === e.target.value); if (value) setForm(v => ({ ...v, categorie: value })); }}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="offre-date">Date limite</Label><Input id="offre-date" type="date" required disabled={busy} value={form.date_limite} onChange={e => setForm(v => ({ ...v, date_limite: e.target.value }))} /></div>
      </div>
      {([ ["description", "Description", 20000], ["conditions", "Conditions", 10000], ["candidature", "Lien HTTPS ou moyen de candidature", 2000] ] as const).map(([field, label, max]) => <div key={field} className="space-y-2"><Label htmlFor={`offre-${field}`}>{label}</Label><Textarea id={`offre-${field}`} required maxLength={max} disabled={busy} value={form[field]} onChange={e => setForm(v => ({ ...v, [field]: e.target.value }))} /></div>)}
      <div className="flex items-center gap-2"><Checkbox id="offre-published" disabled={busy} checked={form.publie} onCheckedChange={value => setForm(v => ({ ...v, publie: value === true }))} /><Label htmlFor="offre-published">Publier l’offre (sinon conserver en brouillon)</Label></div>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}><Save />{busy ? "Enregistrement…" : "Enregistrer"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setShowForm(false)}><X />Annuler</Button></div>
    </form>}
    {offres.isPending && <p role="status">Chargement des offres…</p>}
    {!offres.isPending && !offres.error && !offres.data?.length && <p className="py-8 text-muted-foreground">Aucune offre publiée ou en brouillon.</p>}
    <div className="divide-y divide-border">{offres.data?.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{item.titre}</h3><p className="break-words text-sm text-muted-foreground">{item.organisme} · {item.categorie} · {item.publie ? "Publiée" : "Brouillon"}</p></div><div className="flex gap-2"><Button variant="outline" size="icon" disabled={busy} aria-label={`Modifier ${item.titre}`} title="Modifier" onClick={() => start(item)}><Pencil /></Button><Button variant="destructive" size="icon" disabled={busy} aria-label={`Supprimer ${item.titre}`} title="Supprimer" onClick={() => { setError(""); setDeleting(item); }}><Trash2 /></Button></div></article>)}</div>
    <AlertDialog open={Boolean(deleting)} onOpenChange={open => { if (!open && !busy) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle><AlertDialogDescription className="break-words">{deleting?.titre} sera supprimée définitivement, ainsi que ses favoris.</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-destructive">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={async e => { e.preventDefault(); if (!deleting) return; setBusy(true); setError(""); try { await deleteOffre(deleting.id); setDeleting(null); await refresh(); setMessage("L’offre a été supprimée."); } catch (err) { setError(err instanceof Error ? err.message : "Suppression impossible."); } finally { setBusy(false); } }}>{busy ? "Suppression…" : "Supprimer"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
