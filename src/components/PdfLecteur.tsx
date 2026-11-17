import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Lecteur PDF intégré à CampusLink (pdf.js). Les pages sont dessinées dans l'application :
 * il n'y a ni barre d'outils Chrome, ni bouton « Télécharger » ou « Imprimer ».
 * Le téléchargement reste possible uniquement via le bouton de parrainage des cartes.
 * pdf.js est chargé à la demande depuis cdnjs (aucune dépendance à ajouter au projet).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const VERSION = "3.11.174";
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSION}`;
let promesse: Promise<any> | null = null;

function chargerPdfJs(): Promise<any> {
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (promesse) return promesse;
  promesse = new Promise<any>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${BASE}/pdf.min.js`;
    s.async = true;
    s.onload = () => {
      if (w.pdfjsLib) {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
        resolve(w.pdfjsLib);
      } else {
        promesse = null;
        reject(new Error("pdfjs"));
      }
    };
    s.onerror = () => {
      promesse = null;
      reject(new Error("réseau"));
    };
    document.head.appendChild(s);
  });
  return promesse;
}

export function PdfLecteur({ src }: { src: string }) {
  const zone = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<"chargement" | "ok" | "erreur">("chargement");
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    let annule = false;
    let doc: any = null;
    let obs: IntersectionObserver | null = null;
    setEtat("chargement");

    (async () => {
      try {
        const lib = await chargerPdfJs();
        doc = await lib.getDocument({ url: src }).promise;
        if (annule || !zone.current) return;
        const conteneur = zone.current;
        conteneur.replaceChildren();
        const largeur = Math.max(240, Math.min(conteneur.clientWidth, window.innerWidth) - 16);
        const p1 = await doc.getPage(1);
        const base = p1.getViewport({ scale: 1 });

        const dessiner = async (cadre: HTMLElement, n: number) => {
          try {
            const page = await doc.getPage(n);
            const v0 = page.getViewport({ scale: 1 });
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const vp = page.getViewport({ scale: (largeur / v0.width) * dpr });
            const canvas = document.createElement("canvas");
            canvas.width = Math.floor(vp.width);
            canvas.height = Math.floor(vp.height);
            canvas.style.cssText = "display:block;width:100%;max-width:100%;height:auto";
            await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
            if (annule) return;
            cadre.style.aspectRatio = "";
            cadre.replaceChildren(canvas);
          } catch {
            /* page non dessinée : le cadre blanc reste en place */
          }
        };

        const deja = new Set<number>();
        obs = new IntersectionObserver(
          (entrees) => {
            for (const e of entrees) {
              if (!e.isIntersecting) continue;
              const cadre = e.target as HTMLElement;
              const n = Number(cadre.dataset.page);
              if (deja.has(n)) continue;
              deja.add(n);
              obs?.unobserve(cadre);
              void dessiner(cadre, n);
            }
          },
          { rootMargin: "900px 0px" },
        );

        for (let n = 1; n <= doc.numPages; n++) {
          const cadre = document.createElement("div");
          cadre.dataset.page = String(n);
          cadre.className = "mb-2 w-full min-w-0 max-w-full overflow-hidden rounded bg-white shadow-sm";
          cadre.style.aspectRatio = `${base.width} / ${base.height}`;
          conteneur.appendChild(cadre);
          obs.observe(cadre);
        }
        setEtat("ok");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();

    return () => {
      annule = true;
      obs?.disconnect();
      try {
        void doc?.destroy?.();
      } catch {
        /* document déjà fermé */
      }
    };
  }, [src, essai]);

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden">
      {etat === "chargement" && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du document…
        </p>
      )}
      {etat === "erreur" && (
        <div role="alert" className="space-y-3 py-10 text-center text-sm text-destructive">
          <p className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Le document n’a pas pu être affiché. Vérifie ta connexion puis réessaie.
          </p>
          <button type="button" onClick={() => setEssai((n) => n + 1)} className="rounded-full border border-border px-4 py-1.5 font-semibold text-foreground">
            Réessayer
          </button>
        </div>
      )}
      <div
        ref={zone}
        onContextMenu={(e) => e.preventDefault()}
        className="max-h-[70dvh] w-full min-w-0 max-w-full select-none overflow-y-auto overflow-x-hidden rounded-2xl bg-muted p-2 [-webkit-touch-callout:none]"
        style={{ display: etat === "erreur" ? "none" : undefined }}
      />
    </div>
  );
}

export function LecteurPdf({ src, titre, sousTitre, onClose }: { src: string; titre: string; sousTitre?: string | null; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words font-display text-xl">{titre}</DialogTitle>
          <DialogDescription>{sousTitre || "Lecture en ligne"}</DialogDescription>
        </DialogHeader>
        <PdfLecteur src={src} />
      </DialogContent>
    </Dialog>
  );
}
