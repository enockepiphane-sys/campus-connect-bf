import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { ImageViewer } from "@/components/ImageViewer";
import { analyserLien } from "@/lib/lecture-externe";
import type { Doc } from "@/lib/bibliotheque";

/**
 * Lecteur intégré des documents ajoutés par lien. Même principe que les cours en ligne :
 * YouTube passe par le lecteur officiel, les autres plateformes connues par leur lecteur intégrable officiel.
 * Un site non pris en charge n'est jamais affiché dans un cadre : il s'ouvre sur son site d'origine.
 */
export function LecteurLien({ doc, onClose }: { doc: Doc | null; onClose: () => void }) {
  if (!doc?.lien_url) return null;
  const a = analyserLien(doc.lien_url);
  if (!a.ok) return null;
  const { lecture } = a;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words font-display text-xl">{doc.titre}</DialogTitle>
          <DialogDescription>{doc.auteur ?? "Bibliothèque CampusLink"}</DialogDescription>
        </DialogHeader>

        {lecture.kind === "youtube" && (
          <div className="overflow-hidden rounded-2xl bg-black">
            <YouTubePlayer video={lecture.video} titre={doc.titre} />
          </div>
        )}
        {lecture.kind === "iframe" && (
          <div className={`relative w-full overflow-hidden rounded-2xl bg-muted ${lecture.format === "video" ? "aspect-video" : "h-[70dvh]"}`}>
            <iframe
              src={lecture.src}
              title={doc.titre}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        )}
        {lecture.kind === "pdf" && (
          <div className="relative h-[70dvh] w-full overflow-hidden rounded-2xl bg-muted">
            <iframe src={lecture.src} title={doc.titre} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full border-0" />
          </div>
        )}
        {lecture.kind === "video" && (
          <div className="overflow-hidden rounded-2xl bg-black">
            <video src={lecture.src} controls playsInline preload="metadata" referrerPolicy="no-referrer" className="max-h-[70vh] w-full" />
          </div>
        )}
        {lecture.kind === "image" && <ImageViewer src={lecture.src} alt={doc.titre} />}
        {lecture.kind === "externe" && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <Info className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Ce contenu se lit sur le site de son éditeur</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {a.hote} n’autorise pas l’affichage dans d’autres sites. Ouvre-le directement, c’est gratuit et sans quitter ton compte CampusLink.
            </p>
            <Button asChild className="mt-4">
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                Ouvrir sur {a.hote}
                <ExternalLink />
              </a>
            </Button>
          </div>
        )}

        {doc.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{doc.description}</p>}

        <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>
            Source : <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">{a.fournisseur || a.hote}</a>. Ce contenu reste la propriété de son auteur et de la plateforme d’origine.
          </p>
          {lecture.kind !== "externe" && lecture.kind !== "image" && <p>Le contenu ne s’affiche pas ? Le site d’origine n’autorise peut-être pas la lecture ici : utilise le lien « Source » ci-dessus.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
