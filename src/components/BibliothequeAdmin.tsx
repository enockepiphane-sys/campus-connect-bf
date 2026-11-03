import { ImageField } from "@/components/ImageField";
import { analyserLien, hoteDe } from "@/lib/lecture-externe";
import { aucuneImage, imageUrl, type ImageChoix } from "@/lib/images-contenu";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, FileText, ImageIcon, Link2, Pencil, Plus, Save, Trash2, Upload, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  FILE_ACCEPT, addDocument, addLienDocument, isVideoType, validateDocFile, deleteDocument, deleteProposition, deleteTheme, fileUrl, formatSize, listDocuments, listPropositions,
  listThemes, saveTheme, setPropositionStatus, updateDocument, type Doc, type Proposition, type Theme,
} from "@/lib/bibliotheque";

const SWATCHES = ["#0F8A44", "#0b6b36", "#167d78", "#c08a1e", "#ea580c", "#c2603c", "#2b3a33"];
type Tab = "documents" | "themes" | "propositions";
type DocForm = { theme_id: string; titre: string; auteur: string; description: string; actif: boolean };
const emptyDoc = (theme_id = ""): DocForm => ({ theme_id, titre: "", auteur: "", description: "", actif: true });
type ThemeForm = { id?: string; nom: string; description: string; couleur: string; ordre: number };
const emptyTheme = (ordre = 0): ThemeForm => ({ nom: "", description: "", couleur: SWATCHES[0], ordre });

export function BibliothequeAdmin() {
  const cache = useQueryClient();
  const [tab, setTab] = useState<Tab>("documents");
  const themes = useQuery({ queryKey: ["bibliotheque-themes"], queryFn: listThemes });
  const docs = useQuery({ queryKey: ["bibliotheque-docs-admin"], queryFn: () => listDocuments(true) });
  const props = useQuery({ queryKey: ["bibliotheque-propositions"], queryFn: listPropositions });
  const nouvelles = (props.data ?? []).filter((p) => p.statut === "nouvelle").length;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Documents
  const [docForm, setDocForm] = useState<DocForm>(emptyDoc());
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<ImageChoix>(aucuneImage);
  const [imageActuelle, setImageActuelle] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [mode, setMode] = useState<"fichier" | "lien">("fichier");
  const [lien, setLien] = useState("");
  const [droits, setDroits] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<Doc | null>(null);
  // Thèmes
  const [themeForm, setThemeForm] = useState<ThemeForm | null>(null);
  const [deletingTheme, setDeletingTheme] = useState<Theme | null>(null);

  const themeList = themes.data ?? [];
  const nameOf = (id: string) => themeList.find((t) => t.id === id)?.nom ?? "—";
  const colorOf = (id: string) => themeList.find((t) => t.id === id)?.couleur ?? "#0F8A44";

  async function refresh() {
    await Promise.all(
      ["bibliotheque-themes", "bibliotheque-docs", "bibliotheque-docs-admin", "bibliotheque-propositions"].map((k) => cache.invalidateQueries({ queryKey: [k] })),
    );
  }
  async function run(action: () => Promise<void>, ok: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      await refresh();
      setMessage(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : "L’opération a échoué.");
    } finally {
      setBusy(false);
    }
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    const invalid = validateDocFile(f);
    if (invalid) return setError(invalid);
    setError("");
    setFile(f);
    if (!docForm.titre) setDocForm((v) => ({ ...v, titre: f.name.replace(/\.[^.]+$/, "") }));
  }

  const analyse = lien.trim() ? analyserLien(lien) : null;
  const resetLien = () => { setMode("fichier"); setLien(""); setDroits(false); };

  async function submitDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!docForm.theme_id) return setError("Choisissez un thème.");
    if (!docForm.titre.trim()) return setError("Indiquez un titre.");
    if (editingDoc) {
      await run(async () => {
        await updateDocument(editingDoc, { ...docForm, image, imageActuelle, lien: mode === "lien" ? lien : undefined });
        setEditingDoc(null);
        setImage(aucuneImage());
        setImageActuelle(null);
        setDocForm(emptyDoc(docForm.theme_id));
        resetLien();
      }, "Document modifié.");
    } else if (mode === "lien") {
      if (!analyse || !analyse.ok) return setError(analyse && !analyse.ok ? analyse.erreur : "Collez le lien du contenu.");
      if (!droits) return setError("Confirmez que vous avez le droit de partager ce contenu.");
      await run(async () => {
        await addLienDocument({ lien, ...docForm, image });
        setImage(aucuneImage());
        setLien("");
        setDroits(false);
        setDocForm(emptyDoc(docForm.theme_id));
      }, "Lien ajouté à la bibliothèque.");
    } else {
      if (!file) return setError("Choisissez un fichier (PDF, photo ou vidéo) ou collez un lien.");
      await run(async () => {
        await addDocument({ file, ...docForm, image });
        setFile(null);
        setImage(aucuneImage());
        setDocForm(emptyDoc(docForm.theme_id)); // on garde le thème pour enchaîner les ajouts
      }, "Document ajouté à la bibliothèque.");
    }
  }

  const tabBtn = (k: Tab, label: string, badge?: number) => (
    <button
      key={k}
      type="button"
      onClick={() => {
        setTab(k);
        setError("");
        setMessage("");
      }}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}
    >
      {label}
      {badge ? <span className="rounded-full bg-[#ea580c] px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span> : null}
    </button>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">Bibliothèque</h2>
        <div className="flex flex-wrap gap-2">
          {tabBtn("documents", "Documents")}
          {tabBtn("themes", "Thèmes")}
          {tabBtn("propositions", "Propositions", nouvelles)}
        </div>
      </div>

      {(error || themes.error || docs.error) && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error || themes.error?.message || docs.error?.message}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-primary-soft p-3 text-sm font-medium text-primary">
          {message}
        </p>
      )}

      {/* ---------------- DOCUMENTS ---------------- */}
      {tab === "documents" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] [&>*]:min-w-0">
          <div className="order-2 space-y-5 lg:order-1">
            {docs.isPending && <p role="status">Chargement…</p>}
            {!docs.isPending && !docs.data?.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Aucun document. Ajoutez le premier avec le formulaire.</p>}
            {themeList
              .map((t) => ({ t, list: (docs.data ?? []).filter((d) => d.theme_id === t.id) }))
              .filter((g) => g.list.length)
              .map(({ t, list }) => (
                <div key={t.id} className="card-glass rounded-2xl p-4 sm:p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                    <span className="h-5 w-1.5 rounded-full" style={{ background: t.couleur }} />
                    {t.nom} <span className="text-sm font-medium text-muted-foreground">({list.length})</span>
                  </h3>
                  <ul className="divide-y divide-border">
                    {list.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: t.couleur }}>
                          {d.lien_url ? <Link2 className="h-5 w-5" /> : d.fichier_type === "application/pdf" ? <FileText className="h-5 w-5" /> : isVideoType(d.fichier_type) ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        </span>
                        {imageUrl(d.image_path) && <img src={imageUrl(d.image_path) ?? ""} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-xl border border-border object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold">{d.titre}</p>
                          <p className="break-words text-xs text-muted-foreground">
                            {[d.auteur, d.lien_url ? `Lien · ${hoteDe(d.lien_url)}` : formatSize(d.taille), d.actif ? "Publié" : "Masqué"].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button asChild variant="ghost" size="icon" aria-label="Ouvrir le fichier">
                            <a href={d.lien_url || fileUrl(d)} target="_blank" rel="noopener noreferrer">
                              <BookOpen />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Modifier ${d.titre}`}
                            onClick={() => {
                              setEditingDoc(d.id);
                              setFile(null);
                              setImage(aucuneImage());
                              setImageActuelle(d.image_path ?? null);
                              setMode(d.lien_url ? "lien" : "fichier");
                              setLien(d.lien_url ?? "");
                              setDroits(true);
                              setDocForm({ theme_id: d.theme_id, titre: d.titre, auteur: d.auteur ?? "", description: d.description ?? "", actif: d.actif });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Supprimer ${d.titre}`} onClick={() => setDeletingDoc(d)}>
                            <Trash2 className="text-destructive" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>

          <form onSubmit={submitDoc} className="card-glass order-1 h-fit space-y-4 rounded-2xl p-5 lg:order-2">
            <h3 className="font-display text-lg font-bold">{editingDoc ? "Modifier le document" : "Ajouter un document"}</h3>
            <div className="space-y-1.5">
              <Label htmlFor="bd-theme">Thème *</Label>
              <select id="bd-theme" required value={docForm.theme_id} disabled={busy} onChange={(e) => setDocForm((v) => ({ ...v, theme_id: e.target.value }))} className="h-10 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Choisir un thème…</option>
                {themeList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </select>
            </div>
            {!editingDoc && (
              <div role="group" aria-label="Source du contenu" className="grid grid-cols-2 gap-2">
                {([["fichier", "Envoyer un fichier", Upload], ["lien", "Coller un lien", Link2]] as const).map(([k, label, Ico]) => (
                  <button key={k} type="button" aria-pressed={mode === k} disabled={busy} onClick={() => { setMode(k); setError(""); }}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${mode === k ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted"}`}>
                    <Ico className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>
            )}
            {mode === "lien" && (
              <div className="space-y-1.5">
                <Label htmlFor="bd-lien">Lien du contenu * (https://…)</Label>
                <Input id="bd-lien" type="url" inputMode="url" value={lien} disabled={busy} maxLength={2000} placeholder="https://drive.google.com/file/d/…" onChange={(e) => setLien(e.target.value)} />
                {analyse && (analyse.ok
                  ? analyse.integrable
                    ? <p className="flex items-start gap-2 text-xs text-primary"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />Lecture intégrée dans CampusLink ({analyse.fournisseur}).</p>
                    : <p className="text-xs text-muted-foreground">Ce site ne permet pas la lecture intégrée : les étudiants verront un bouton pour l’ouvrir sur {analyse.hote}.</p>
                  : <p role="alert" className="text-xs text-destructive">{analyse.erreur}</p>)}
                <p className="text-xs text-muted-foreground">Lecture intégrée : YouTube, Vimeo, Dailymotion, Google Drive (partage « avec le lien »), Internet Archive, et liens directs vers un PDF, une vidéo ou une image.</p>
                {!editingDoc && (
                  <label className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs">
                    <input type="checkbox" className="mt-0.5" checked={droits} disabled={busy} onChange={(e) => setDroits(e.target.checked)} />
                    <span>Je confirme que ce contenu est libre de droits, que j’en ai l’autorisation, ou que son propriétaire permet de le partager.</span>
                  </label>
                )}
              </div>
            )}
            {!editingDoc && mode === "fichier" && (
              <div className="space-y-1.5">
                <Label htmlFor="bd-file">Fichier * (PDF, photo ou vidéo)</Label>
                <Input id="bd-file" type="file" accept={FILE_ACCEPT} disabled={busy} onChange={(e) => pickFile(e.target.files?.[0])} />
                <p className="text-xs text-muted-foreground">PDF et photos : 50 Mo max. Vidéos (MP4, WebM, MOV) : 200 Mo max.</p>
                {file && <p className="break-all text-xs text-muted-foreground">{file.name} · {formatSize(file.size)}</p>}
              </div>
            )}
            <ImageField id="bd-image" label="Image de couverture" actuel={imageActuelle} choix={image} onChange={setImage} disabled={busy} />
            <div className="space-y-1.5">
              <Label htmlFor="bd-titre">Titre *</Label>
              <Input id="bd-titre" value={docForm.titre} maxLength={200} disabled={busy} onChange={(e) => setDocForm((v) => ({ ...v, titre: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-auteur">Auteur</Label>
              <Input id="bd-auteur" value={docForm.auteur} maxLength={150} disabled={busy} onChange={(e) => setDocForm((v) => ({ ...v, auteur: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-desc">Description</Label>
              <Textarea id="bd-desc" value={docForm.description} maxLength={2000} disabled={busy} onChange={(e) => setDocForm((v) => ({ ...v, description: e.target.value }))} className="min-h-24" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={docForm.actif} disabled={busy} onChange={(e) => setDocForm((v) => ({ ...v, actif: e.target.checked }))} />
              Visible par les étudiants
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {editingDoc ? <Save /> : <Plus />}
                {busy ? "Envoi en cours… (peut durer pour un gros fichier)" : editingDoc ? "Enregistrer" : "Ajouter"}
              </Button>
              {editingDoc && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditingDoc(null);
                    setImage(aucuneImage());
                    setImageActuelle(null);
                    setDocForm(emptyDoc(docForm.theme_id));
                    resetLien();
                  }}
                >
                  <X />
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ---------------- THÈMES ---------------- */}
      {tab === "themes" && (
        <div className="space-y-4">
          <Button onClick={() => setThemeForm(emptyTheme(themeList.length + 1))}>
            <Plus />
            Nouveau thème
          </Button>
          {themeForm && (
            <form
              className="card-glass space-y-4 rounded-2xl p-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!themeForm.nom.trim()) return setError("Indiquez le nom du thème.");
                void run(async () => {
                  await saveTheme(themeForm);
                  setThemeForm(null);
                }, "Thème enregistré.");
              }}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <div className="space-y-1.5">
                  <Label htmlFor="th-nom">Nom *</Label>
                  <Input id="th-nom" value={themeForm.nom} maxLength={80} disabled={busy} onChange={(e) => setThemeForm({ ...themeForm, nom: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="th-ordre">Position dans la liste</Label>
                  <Input id="th-ordre" type="number" value={themeForm.ordre} disabled={busy} onChange={(e) => setThemeForm({ ...themeForm, ordre: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="th-desc">Description</Label>
                <Input id="th-desc" value={themeForm.description} maxLength={300} disabled={busy} onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((c) => (
                    <button key={c} type="button" aria-label={`Couleur ${c}`} onClick={() => setThemeForm({ ...themeForm, couleur: c })} className="grid h-9 w-9 place-items-center rounded-full ring-offset-2 ring-offset-background transition" style={{ background: c, outline: themeForm.couleur === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}>
                      {themeForm.couleur === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  <Save />
                  Enregistrer
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setThemeForm(null)}>
                  <X />
                  Annuler
                </Button>
              </div>
            </form>
          )}
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {themeList.map((t) => {
              const count = (docs.data ?? []).filter((d) => d.theme_id === t.id).length;
              return (
                <li key={t.id} className="flex flex-wrap items-center gap-3 p-4">
                  <span className="h-8 w-8 shrink-0 rounded-xl" style={{ background: t.couleur }} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold">{t.nom}</p>
                    <p className="break-words text-xs text-muted-foreground">{[t.description, `${count} document${count > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Modifier ${t.nom}`} onClick={() => setThemeForm({ id: t.id, nom: t.nom, description: t.description ?? "", couleur: t.couleur, ordre: t.ordre })}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Supprimer ${t.nom}`} onClick={() => setDeletingTheme(t)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ---------------- PROPOSITIONS ---------------- */}
      {tab === "propositions" && (
        <div className="space-y-3">
          {props.isPending && <p role="status">Chargement…</p>}
          {props.error && <p role="alert" className="text-destructive">{props.error.message}</p>}
          {!props.isPending && !props.data?.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Aucune proposition pour le moment.</p>}
          {(props.data ?? []).map((p: Proposition) => (
            <article key={p.id} className="card-glass flex flex-wrap items-start gap-3 rounded-2xl p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words font-display text-lg font-bold">{p.titre}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${p.statut === "nouvelle" ? "bg-[#ea580c] text-white" : p.statut === "retenue" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
                    {p.statut === "nouvelle" ? "Nouvelle" : p.statut === "retenue" ? "Retenue" : "Refusée"}
                  </span>
                </div>
                {p.auteur && <p className="text-sm font-medium text-muted-foreground">{p.auteur}</p>}
                {p.commentaire && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{p.commentaire}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={busy || p.statut === "retenue"} onClick={() => void run(() => setPropositionStatus(p.id, "retenue"), "Proposition retenue.")}>
                  <Check />
                  Retenir
                </Button>
                <Button variant="outline" size="sm" disabled={busy || p.statut === "refusee"} onClick={() => void run(() => setPropositionStatus(p.id, "refusee"), "Proposition refusée.")}>
                  <X />
                  Refuser
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Supprimer ${p.titre}`} disabled={busy} onClick={() => void run(() => deleteProposition(p.id), "Proposition supprimée.")}>
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deletingDoc)} onOpenChange={(o) => !o && !busy && setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>« {deletingDoc?.titre} » ({deletingDoc ? nameOf(deletingDoc.theme_id) : ""}) sera supprimé définitivement, avec son fichier.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                const d = deletingDoc;
                if (d) void run(() => deleteDocument(d), "Document supprimé.").then(() => setDeletingDoc(null));
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deletingTheme)} onOpenChange={(o) => !o && !busy && setDeletingTheme(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce thème ?</AlertDialogTitle>
            <AlertDialogDescription>Le thème « {deletingTheme?.nom} » sera supprimé. S’il contient encore des documents, la suppression sera refusée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                const t = deletingTheme;
                if (t) void run(() => deleteTheme(t.id), "Thème supprimé.").then(() => setDeletingTheme(null));
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
