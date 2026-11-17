import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Lecteur PDF intégré à CampusLink (pdf.js), en plein écran.
 * Les pages sont dessinées dans l'application : ni barre d'outils Chrome, ni bouton Télécharger/Imprimer.
 * Les pages occupent toute la largeur de l'écran ; les boutons loupe agrandissent le texte.
 * pdf.js est chargé à la demande depuis cdnjs (aucune dépendance à ajouter au projet).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const VERSION = "3.11.174";
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSION}`;
const ZOOMS = [1, 1.5, 2, 3];
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

function PdfPages({ src, zoom }: { src: string; zoom: number }) {
  const defil = useRef<HTMLDivElement>(null);
  const pages = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const [etat, setEtat] = useState<"chargement" | "ok" | "erreur">("chargement");
  const [essai, setEssai] = useState(0);

  // 1) Chargement du document
  useEffect(() => {
    let annule = false;
    setEtat("chargement");
    docRef.current = null;
    (async () => {
      try {
        const lib = await chargerPdfJs();
        const doc = await lib.getDocument({ url: src }).promise;
        if (annule) {
          try { void doc.destroy?.(); } catch { /* ignoré */ }
          return;
        }
        docRef.current = doc;
        setEtat("ok");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
      const d = docRef.current;
      docRef.current = null;
      try { void d?.destroy?.(); } catch { /* ignoré */ }
    };
  }, [src, essai]);

  // 2) Dessin des pages (relancé quand le zoom change)
  useEffect(() => {
    const doc = docRef.current;
    const zoneDefil = defil.current;
    const conteneur = pages.current;
    if (etat !== "ok" || !doc || !zoneDefil || !conteneur) return;
    let annule = false;
    let obs: IntersectionObserver | null = null;
    const position = zoneDefil.scrollHeight > 0 ? zoneDefil.scrollTop / zoneDefil.scrollHeight : 0;
    conteneur.replaceChildren();

    (async () => {
      const largeur = Math.max(200, conteneur.clientWidth);
      const p1 = await doc.getPage(1);
      if (annule) return;
      const base = p1.getViewport({ scale: 1 });

      const dessiner = async (cadre: HTMLElement, n: number) => {
        try {
          const page = await doc.getPage(n);
          const v0 = page.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, zoom > 1 ? 1.5 : 2);
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
        cadre.className = "mb-1 w-full min-w-0 overflow-hidden bg-white";
        cadre.style.aspectRatio = `${base.width} / ${base.height}`;
        conteneur.appendChild(cadre);
        obs.observe(cadre);
      }
      zoneDefil.scrollTop = position * zoneDefil.scrollHeight;
    })().catch(() => {
      if (!annule) setEtat("erreur");
    });

    return () => {
      annule = true;
      obs?.disconnect();
    };
  }, [etat, zoom]);

  return (
    <div className="relative min-h-0 w-full min-w-0 flex-1">
      {etat === "chargement" && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du document…
        </p>
      )}
      {etat === "erreur" && (
        <div role="alert" className="space-y-3 px-4 py-10 text-center text-sm text-destructive">
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
        ref={defil}
        onContextMenu={(e) => e.preventDefault()}
        className={`h-full w-full select-none overflow-y-auto bg-muted [-webkit-touch-callout:none] ${zoom > 1 ? "overflow-x-auto" : "overflow-x-hidden"}`}
        style={{ display: etat === "erreur" ? "none" : undefined }}
      >
        <div ref={pages} style={{ width: `${zoom * 100}%` }} />
      </div>
    </div>
  );
}

/** Fenêtre plein écran : le PDF remplit toute la largeur du téléphone, sans déborder. */
export function LecteurPdf({ src, titre, sousTitre, onClose }: { src: string; titre: string; sousTitre?: string | null; onClose: () => void }) {
  const [niveau, setNiveau] = useState(0);
  const zoom = ZOOMS[niveau];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="left-0 top-0 flex h-[100dvh] max-h-none w-[100dvw] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none sm:rounded-none">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 pr-12">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-display text-base leading-tight">{titre}</DialogTitle>
            <DialogDescription className="truncate text-xs">{sousTitre || "Lecture en ligne"}</DialogDescription>
          </div>
          <button
            type="button"
            aria-label="Réduire le texte"
            disabled={niveau === 0}
            onClick={() => setNiveau((n) => Math.max(0, n - 1))}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Agrandir le texte"
            disabled={niveau === ZOOMS.length - 1}
            onClick={() => setNiveau((n) => Math.min(ZOOMS.length - 1, n + 1))}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <PdfPages src={src} zoom={zoom} />
      </DialogContent>
    </Dialog>
  );
}
