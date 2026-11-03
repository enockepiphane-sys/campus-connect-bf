import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IMAGE_ACCEPT, imageUrl, validerImage, type ImageChoix } from "@/lib/images-contenu";

/** Choix d'une image (aperçu, remplacement, retrait) pour un formulaire de publication. */
export function ImageField({ id, label = "Image", actuel, choix, onChange, disabled }: {
  id: string; label?: string; actuel: string | null | undefined; choix: ImageChoix; onChange: (c: ImageChoix) => void; disabled?: boolean;
}) {
  const [erreur, setErreur] = useState("");
  const [apercu, setApercu] = useState<string | null>(null);
  useEffect(() => {
    if (!choix.file) return setApercu(null);
    const url = URL.createObjectURL(choix.file);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [choix.file]);

  const affichee = apercu ?? (choix.retirer ? null : imageUrl(actuel));
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} (facultatif)</Label>
      {affichee && <img src={affichee} alt="Aperçu de l’image" className="max-h-48 w-full rounded-xl border border-border object-cover" />}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => document.getElementById(id)?.click()}>
          <ImagePlus />{affichee ? "Changer l’image" : "Ajouter une image"}
        </Button>
        {affichee && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { setErreur(""); onChange({ file: null, retirer: true }); }}>
            <Trash2 className="text-destructive" />Retirer
          </Button>
        )}
      </div>
      <input id={id} type="file" accept={IMAGE_ACCEPT} className="sr-only" disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const err = validerImage(f);
          if (err) return setErreur(err);
          setErreur("");
          onChange({ file: f, retirer: false });
        }} />
      {erreur && <p role="alert" className="text-xs text-destructive">{erreur}</p>}
      <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, redimensionnée automatiquement.</p>
    </div>
  );
}
