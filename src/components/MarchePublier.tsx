import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES_MARCHE,
  MAX_PHOTOS,
  PHOTO_MIMES,
  TYPES_ANNONCE,
  VILLES_SUGGEREES,
  createAnnonce,
  validateAnnonce,
  validatePhoto,
  type AnnonceInput,
  type TypeAnnonce,
} from "@/lib/marche";

const VIDE: AnnonceInput = {
  type_annonce: "vente",
  categorie: "Livres",
  titre: "",
  description: "",
  prix: "",
  ville: "",
  universite: "",
  contact: "",
  auteur_nom: "",
};

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

const PRIX_LABEL: Record<TypeAnnonce, string> = {
  vente: "Prix (FCFA)",
  recherche: "Budget maximum (FCFA)",
  service: "Tarif à partir de (FCFA)",
  colocation: "Loyer par mois (FCFA)",
};

export function MarchePublier({ open, onClose, onPublished }: { open: boolean; onClose: () => void; onPublished: () => void }) {
  const [form, setForm] = useState<AnnonceInput>(VIDE);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function set<K extends keyof AnnonceInput>(key: K, value: AnnonceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function changeType(type: TypeAnnonce) {
    setForm((f) => ({
      ...f,
      type_annonce: type,
      categorie: type === "service" ? "Services" : type === "colocation" ? "Colocation & logement" : f.categorie === "Services" || f.categorie === "Colocation & logement" ? "Livres" : f.categorie,
    }));
  }
  function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    const next = [...files];
    for (const file of Array.from(list)) {
      const probleme = validatePhoto(file);
      if (probleme) return setError(probleme);
      if (next.length >= MAX_PHOTOS) return setError(`${MAX_PHOTOS} photos au maximum.`);
      next.push(file);
    }
    setFiles(next);
  }
  function fermer() {
    if (busy) return;
    setError("");
    onClose();
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const probleme = validateAnnonce(form);
    if (probleme) return setError(probleme);
    setBusy(true);
    setError("");
    try {
      await createAnnonce(form, files);
      setForm((f) => ({ ...VIDE, auteur_nom: f.auteur_nom, ville: f.ville, universite: f.universite, contact: f.contact }));
      setFiles([]);
      onPublished();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La publication a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) fermer(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Publier une annonce</DialogTitle>
          <DialogDescription>Gratuit. Les acheteurs te contactent directement : aucun paiement ne passe par CampusLink.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Type d’annonce</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TYPES_ANNONCE.map((t) => {
                const actif = form.type_annonce === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => changeType(t.value)}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold transition"
                    style={actif ? { background: t.color, borderColor: t.color, color: "#fff" } : { background: `${t.color}14`, borderColor: `${t.color}55`, color: t.color }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="mk-categorie">Catégorie</Label>
            <select id="mk-categorie" className={selectClass} value={form.categorie} onChange={(e) => set("categorie", e.target.value as AnnonceInput["categorie"])}>
              {CATEGORIES_MARCHE.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="mk-titre">Titre</Label>
            <Input id="mk-titre" maxLength={120} placeholder="Ex. : Cours de droit civil L2, très bon état" value={form.titre} onChange={(e) => set("titre", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="mk-desc">Description</Label>
            <Textarea id="mk-desc" rows={5} maxLength={3000} placeholder="État, contenu, disponibilités, conditions…" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mk-prix">{PRIX_LABEL[form.type_annonce]}</Label>
              <Input id="mk-prix" inputMode="numeric" placeholder="Vide = à discuter, 0 = gratuit" value={form.prix} onChange={(e) => set("prix", e.target.value.replace(/[^\d\s.]/g, ""))} />
            </div>
            <div>
              <Label htmlFor="mk-ville">Ville</Label>
              <Input id="mk-ville" list="mk-villes" maxLength={80} placeholder="Ouagadougou" value={form.ville} onChange={(e) => set("ville", e.target.value)} />
              <datalist id="mk-villes">
                {VILLES_SUGGEREES.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <Label htmlFor="mk-univ">Université ou établissement (facultatif)</Label>
            <Input id="mk-univ" maxLength={120} placeholder="Ex. : Joseph Ki-Zerbo, Nazi Boni…" value={form.universite} onChange={(e) => set("universite", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mk-nom">Nom affiché</Label>
              <Input id="mk-nom" maxLength={80} placeholder="Ton prénom" value={form.auteur_nom} onChange={(e) => set("auteur_nom", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="mk-contact">Numéro WhatsApp / téléphone</Label>
              <Input id="mk-contact" type="tel" inputMode="tel" maxLength={30} placeholder="70 00 00 00" value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Ton numéro n’est visible que par les personnes connectées à CampusLink.</p>

          <div>
            <Label>Photos (facultatif, {MAX_PHOTOS} maximum)</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={src} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                  <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Retirer la photo ${i + 1}`}
                    onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {files.length < MAX_PHOTOS && (
                <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:bg-muted">
                  <ImagePlus className="h-6 w-6" />
                  <span className="sr-only">Ajouter une photo</span>
                  <input type="file" accept={PHOTO_MIMES.join(",")} multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={fermer} disabled={busy}>Annuler</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Publication…" : "Publier l’annonce"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
