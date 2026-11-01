import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CATEGORIES_GUIDE, deleteGuide, listGuide, saveGuide, type GuideArticle, type GuideInput } from "@/lib/guide";

const empty = (ordre = 0): GuideInput => ({ categorie: CATEGORIES_GUIDE[0], titre: "", contenu: "", lien: "", ordre, actif: true });

export function GuideAdmin() {
  const cache = useQueryClient();
  const guide = useQuery({ queryKey: ["guide-articles-admin"], queryFn: () => listGuide(true) });
  const all = guide.data ?? [];
  const [form, setForm] = useState<GuideInput>(empty());
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<GuideArticle | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const categories = [...new Set([...CATEGORIES_GUIDE, ...all.map((a) => a.categorie)])];
  const set = <K extends keyof GuideInput>(k: K, v: GuideInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function refresh() {
    await Promise.all(["guide-articles", "guide-articles-admin"].map((k) => cache.invalidateQueries({ queryKey: [k] })));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.categorie.trim()) return setError("Indiquez une rubrique.");
    if (!form.titre.trim()) return setError("Indiquez un titre.");
    if (!form.contenu.trim()) return setError("Écrivez le contenu de la fiche.");
    setBusy(true);
    try {
      await saveGuide(form, editing ?? undefined);
      await refresh();
      setMessage(editing ? "Fiche modifiée." : "Fiche ajoutée.");
      setEditing(null);
      setForm(empty((all.at(-1)?.ordre ?? 0) + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "L’opération a échoué.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteGuide(deleting.id);
      await refresh();
      setMessage("Fiche supprimée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "La suppression a échoué.");
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Guide des nouveaux bacheliers</h2>
        <p className="text-sm text-muted-foreground">Ajoutez, modifiez ou retirez les fiches d’aide (Campus Faso, orientation, inscription…).</p>
      </div>
      {message && <p role="status" className="flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary"><Check className="h-4 w-4" />{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="order-2 space-y-4 lg:order-1">
          {guide.isPending && <p role="status">Chargement…</p>}
          {guide.error && <p role="alert" className="text-destructive">{(guide.error as Error).message}</p>}
          {!guide.isPending && !all.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Aucune fiche pour l’instant.</p>}
          {categories.filter((c) => all.some((a) => a.categorie === c)).map((c) => (
            <div key={c} className="card-glass rounded-2xl p-4 sm:p-5">
              <h3 className="mb-2 font-display text-lg font-bold">{c}</h3>
              <ul className="divide-y divide-border">
                {all.filter((a) => a.categorie === c).map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{a.titre}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{a.actif ? "Publiée" : "Masquée"} · ordre {a.ordre} · {a.contenu}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Modifier ${a.titre}`} onClick={() => {
                      setEditing(a.id);
                      setForm({ categorie: a.categorie, titre: a.titre, contenu: a.contenu, lien: a.lien ?? "", ordre: a.ordre, actif: a.actif });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}><Pencil /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Supprimer ${a.titre}`} onClick={() => setDeleting(a)}><Trash2 className="text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="card-glass order-1 space-y-4 self-start rounded-2xl p-5 lg:order-2 lg:sticky lg:top-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            {editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editing ? "Modifier la fiche" : "Ajouter une fiche"}
          </h3>
          <div className="space-y-1.5">
            <Label htmlFor="g-cat">Rubrique *</Label>
            <Input id="g-cat" list="g-cats" value={form.categorie} onChange={(e) => set("categorie", e.target.value)} maxLength={80} />
            <datalist id="g-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-titre">Titre *</Label>
            <Input id="g-titre" value={form.titre} onChange={(e) => set("titre", e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-contenu">Contenu *</Label>
            <Textarea id="g-contenu" value={form.contenu} onChange={(e) => set("contenu", e.target.value)} maxLength={10000} className="min-h-48" placeholder={"Écrivez les explications.\nUne ligne par étape : 1. … 2. …"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-lien">Lien utile (facultatif)</Label>
            <Input id="g-lien" type="url" value={form.lien} onChange={(e) => set("lien", e.target.value)} placeholder="https://www.campusfaso.bf" />
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="g-ordre">Ordre d’affichage</Label>
              <Input id="g-ordre" type="number" value={form.ordre} onChange={(e) => set("ordre", Number(e.target.value) || 0)} />
            </div>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={form.actif} onChange={(e) => set("actif", e.target.checked)} className="h-4 w-4" />
              Visible
            </label>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="flex-1"><Save />{busy ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter la fiche"}</Button>
            {editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm(empty()); }}><X />Annuler</Button>}
          </div>
        </form>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette fiche ?</AlertDialogTitle>
            <AlertDialogDescription>« {deleting?.titre} » ne sera plus visible dans le guide.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
