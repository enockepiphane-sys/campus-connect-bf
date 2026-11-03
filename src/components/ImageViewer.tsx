import { useState } from "react";
import { ExternalLink, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Image affichée en entier (jamais rognée). Un clic ouvre une grande visionneuse :
 * l'image est visible en totalité, avec un bouton pour zoomer (lire les petits textes)
 * et un lien pour l'ouvrir dans un nouvel onglet.
 */
export function ImageViewer({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setZoom(false); setOpen(true); }}
        aria-label={`Agrandir l’image : ${alt}`}
        className={`group relative block w-full overflow-hidden rounded-xl border border-border bg-muted/40 ${className}`}
      >
        <img src={src} alt={alt} loading="lazy" className="mx-auto max-h-[60dvh] w-full object-contain" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white">
          <Maximize2 className="h-3.5 w-3.5" />
          Voir en entier
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[95dvh] max-w-[96vw] flex-col gap-3 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="break-words text-base">{alt}</DialogTitle>
            <DialogDescription>Image complète. Utilisez le zoom pour lire les petits caractères.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setZoom((z) => !z)}>
              {zoom ? <ZoomOut /> : <ZoomIn />}
              {zoom ? "Réduire" : "Zoomer"}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                Ouvrir dans un onglet
              </a>
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-muted/40">
            <img
              src={src}
              alt={alt}
              className={zoom ? "h-auto w-[220%] max-w-none sm:w-[160%]" : "mx-auto h-auto max-h-[72dvh] w-auto max-w-full object-contain"}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
