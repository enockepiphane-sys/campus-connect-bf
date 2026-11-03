import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageField } from "@/components/ImageField";
import { parseYoutube, youtubeMiniature } from "@/lib/youtube";
import { aucuneImage, imageUrl, type ImageChoix } from "@/lib/images-contenu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  FILIERES_SUGGEREES, NIVEAUX, TYPES, addCours, coursFileUrl, deleteCours, embedUrl, formatSize, listCours, updateCours, validateFile,
  type Cours, type CoursInput,
} from "@/lib/cours-en-ligne";

const empty = (prev?: Partial<CoursInput>): CoursInput => ({
  filiere: prev?.filiere ?? "",
  niveau: prev?.niveau ?? "L1",
  module: prev?.module ?? "",
  titre: "",
  description: "",
  enseignant: "",
  type_contenu: prev?.type_contenu ?? "pdf",
  video_url: "",
  actif: true,
});
const selectCls = "h-10 w-full min-w-0 max-w-full truncate rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function CoursEnLigneAdmin() {
  const cache = useQueryClient();
  const cours = useQuery({ queryKey: ["cours-en-ligne-admin"], queryFn: () => listCours(true) });
  const all = cours.data ?? [];
  const [form, setForm] = useState<CoursInput>(empty());
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<ImageChoix>(aucuneImage);
  const [editing, setEditing] = useState<Cours | null>(null);
  const [deleting, setDeleting] = useState<Cours | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filtre, setFiltre] = useState("");

  const filieres = useMemo(() => [...new Set([...all.map((c) => c.filiere), ...FILIERES_SUGGEREES])].sort((a, b) => a.localeCompare(b, "fr")), [all]);
  const modules = useMemo(() => [...new Set(all.filter((c) => c.filiere === form.filiere && c.niveau === form.niveau).map((c) => c.module))], [all, form.filiere, form.niveau]);
  const type = TYPES.find((t) => t.value === form.type_contenu)!;

  const set = <K extends keyof CoursInput>(k: K, v: CoursInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  function pick(f: File | undefined) {
    if (!f) return;
    const err = validateFile(form.type_contenu, f);
    if (err) return setError(err);
    setError("");
    setFile(f);
    if (!form.titre) set("titre", f.name.replace(/\.[^.]+$/, ""));
  }

  function reset(keep = true) {
    setForm(keep ? empty(form) : empty());
    setFile(null);
    setImage(aucuneImage());
    setEditing(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.filiere.trim()) return setError("Indiquez la filière (ex. : Droit).");
    if (!form.module.trim()) return setError("Indiquez le nom du module.");
    if (!form.titre.trim()) return setError("Indiquez le titre du cours.");
    if (!editing && !file && !form.video_url.trim()) return setError(form.type_contenu === "video" ? "Ajoutez un fichier vidéo ou un lien YouTube/Vimeo." : "Ajoutez le fichier du cours.");
    if (form.video_url.trim() && !embedUrl(form.video_url)) return setError("Lien vidéo non reconnu. Collez un lien YouTube (watch, youtu.be, partage, shorts) ou Vimeo.");
    if (file) {
      const err = validateFile(form.type_contenu, file);
      if (err) return setError(err);
    }
    setBusy(true);
    try {
      if (editing) await updateCours(editing, form, file, image);
      else await addCours(form, file, image);
      await Promise.all(["cours-en-ligne", "cours-en-ligne-admin"].map((k) => cache.invalidateQueries({ queryKey: [k] })));
      setMessage(editing ? "Cours modifié." : "Cours publié.");
      reset();
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
      await deleteCours(deleting);
      await Promise.all(["cours-en-ligne", "cours-en-ligne-admin"].map((k) => cache.invalidateQueries({ queryKey: [k] })));
      setMessage("Cours supprimé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "La suppression a échoué.");
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  const visibles = all.filter((c) => !filtre || c.filiere === filtre);
  const groups = useMemo(() => {
    const map = new Map<string, Cours[]>();
    for (const c of visibles) map.set(`${c.filiere} › ${c.niveau} › ${c.module}`, [...(map.get(`${c.filiere} › ${c.niveau} › ${c.module}`) ?? []), c]);
    return [...map.entries()];
  }, [visibles]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Cours en ligne</h2>
        <p className="text-sm text-muted-foreground">Classez chaque cours par filière, niveau et module : les étudiants les retrouvent avec ces mêmes filtres.</p>
      </div>
      {message && <p role="status" className="flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary"><Check className="h-4 w-4" />{message}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] [&>*]:min-w-0">
        {/* Liste */}
        <div className="order-2 space-y-4 lg:order-1">
          <select aria-label="Filtrer par filière" value={filtre} onChange={(e) => setFiltre(e.target.value)} className={selectCls}>
            <option value="">Toutes les filières ({all.length} cours)</option>
            {[...new Set(all.map((c) => c.filiere))].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          {cours.isPending && <p role="status">Chargement…</p>}
          {cours.error && <p role="alert" className="text-destructive">{(cours.error as Error).message}</p>}
          {!cours.isPending && !visibles.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Aucun cours. Ajoutez le premier avec le formulaire.</p>}
          {groups.map(([titre, list]) => (
            <div key={titre} className="card-glass rounded-2xl p-4 sm:p-5">
              <h3 className="mb-2 break-words font-display text-base font-bold">{titre} <span className="text-sm font-medium text-muted-foreground">({list.length})</span></h3>
              <ul className="divide-y divide-border">
                {list.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    {imageUrl(c.image_path) && <img src={imageUrl(c.image_path) ?? ""} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{c.titre}</p>
                      <p className="break-words text-xs text-muted-foreground">
                        {[TYPES.find((t) => t.value === c.type_contenu)?.label, c.enseignant, formatSize(c.taille), c.actif ? "Publié" : "Masqué"].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label="Ouvrir">
                        <a href={c.fichier_path ? coursFileUrl(c) : c.video_url ?? "#"} target="_blank" rel="noopener noreferrer"><BookOpen /></a>
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Modifier ${c.titre}`} onClick={() => {
                        setEditing(c);
                        setFile(null);
                        setImage(aucuneImage());
                        setForm({ filiere: c.filiere, niveau: c.niveau, module: c.module, titre: c.titre, description: c.description ?? "", enseignant: c.enseignant ?? "", type_contenu: c.type_contenu, video_url: c.video_url ?? "", actif: c.actif });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}><Pencil /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Supprimer ${c.titre}`} onClick={() => setDeleting(c)}><Trash2 className="text-destructive" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="card-glass order-1 min-w-0 space-y-4 self-start rounded-2xl p-5 lg:order-2 lg:sticky lg:top-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            {editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editing ? "Modifier le cours" : "Ajouter un cours"}
          </h3>

          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">1. Classement</p>
          <div className="space-y-1.5">
            <Label htmlFor="c-filiere">Filière *</Label>
            <Input id="c-filiere" list="c-filieres" value={form.filiere} onChange={(e) => set("filiere", e.target.value)} placeholder="Ex. : Droit, Informatique…" maxLength={100} />
            <datalist id="c-filieres">{filieres.map((f) => <option key={f} value={f} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-niveau">Niveau *</Label>
              <select id="c-niveau" value={form.niveau} onChange={(e) => set("niveau", e.target.value as CoursInput["niveau"])} className={selectCls}>
                {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-module">Module *</Label>
              <Input id="c-module" list="c-modules" value={form.module} onChange={(e) => set("module", e.target.value)} placeholder="Ex. : Droit civil" maxLength={150} />
              <datalist id="c-modules">{modules.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
          </div>

          <p className="pt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">2. Le cours</p>
          <div className="space-y-1.5">
            <Label htmlFor="c-titre">Titre du cours *</Label>
            <Input id="c-titre" value={form.titre} onChange={(e) => set("titre", e.target.value)} maxLength={200} placeholder="Ex. : Chapitre 1 — Les personnes" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-ens">Enseignant (facultatif)</Label>
            <Input id="c-ens" value={form.enseignant} onChange={(e) => set("enseignant", e.target.value)} maxLength={150} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description (facultatif)</Label>
            <Textarea id="c-desc" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} className="min-h-20" />
          </div>

          <p className="pt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">3. Format et fichier</p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t.value} type="button" aria-pressed={form.type_contenu === t.value}
                onClick={() => { set("type_contenu", t.value); setFile(null); }}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${form.type_contenu === t.value ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-5 text-center text-sm transition hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            {file ? <span className="break-all font-semibold">{file.name} ({formatSize(file.size)})</span> : <span>{editing?.fichier_path ? "Remplacer le fichier (facultatif)" : "Choisir le fichier"} — 200 Mo max.</span>}
            <input type="file" accept={type.accept} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          <ImageField id="c-image" label="Image de couverture" actuel={editing?.image_path} choix={image} onChange={setImage} disabled={busy} />
          {form.type_contenu === "video" && (
            <div className="space-y-1.5">
              <Label htmlFor="c-url">…ou lien YouTube / Vimeo</Label>
              <Input id="c-url" type="url" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
              {form.video_url.trim() && (embedUrl(form.video_url)
                ? <p className="flex items-center gap-2 text-xs text-primary"><Check className="h-3.5 w-3.5 shrink-0" />{parseYoutube(form.video_url) ? "Lien YouTube reconnu : la vidéo sera lue dans CampusLink." : "Lien Vimeo reconnu."}{parseYoutube(form.video_url) && <img src={youtubeMiniature(parseYoutube(form.video_url)!.id)} alt="" className="ml-auto h-8 rounded" onError={(e) => { e.currentTarget.style.display = "none"; }} />}</p>
                : <p role="alert" className="text-xs text-destructive">Lien non reconnu : utilisez un lien YouTube ou Vimeo.</p>)}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.actif} onChange={(e) => set("actif", e.target.checked)} className="h-4 w-4" />
            Visible par les étudiants
          </label>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="flex-1"><Save />{busy ? "Envoi en cours…" : editing ? "Enregistrer" : "Publier le cours"}</Button>
            {editing && <Button type="button" variant="outline" onClick={() => reset(false)}><X />Annuler</Button>}
          </div>
        </form>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
            <AlertDialogDescription>« {deleting?.titre} » et son fichier seront définitivement supprimés.</AlertDialogDescription>
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
