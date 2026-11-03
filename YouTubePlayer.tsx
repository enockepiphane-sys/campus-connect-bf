import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { messageErreurYoutube, type YoutubeRef } from "@/lib/youtube";

// Lecteur YouTube intégré officiel (IFrame Player API). La lecture reste dans CampusLink :
// lecture/pause, volume, plein écran et qualité sont ceux du lecteur YouTube.
/* eslint-disable @typescript-eslint/no-explicit-any */
type YT = any;
let apiPromise: Promise<YT> | null = null;
function chargerApi(): Promise<YT> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YT>((resolve, reject) => {
    const precedent = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { precedent?.(); resolve(w.YT); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => { apiPromise = null; reject(new Error("api")); };
    document.head.appendChild(s);
    setTimeout(() => { if (!w.YT?.Player) { apiPromise = null; reject(new Error("délai")); } }, 10000);
  });
  return apiPromise;
}

export function YouTubePlayer({ video, titre }: { video: YoutubeRef; titre: string }) {
  const zone = useRef<HTMLDivElement>(null);
  const [erreur, setErreur] = useState("");
  const [secours, setSecours] = useState(false);

  useEffect(() => {
    if (secours) return;
    let lecteur: YT = null;
    let annule = false;
    setErreur("");
    chargerApi().then((api) => {
      if (annule || !zone.current) return;
      const cible = document.createElement("div");
      zone.current.replaceChildren(cible);
      lecteur = new api.Player(cible, {
        videoId: video.id,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1, fs: 1, start: video.start || undefined, origin: window.location.origin },
        events: { onError: (e: { data: number }) => setErreur(messageErreurYoutube(e.data)) },
      });
    }).catch(() => { if (!annule) setSecours(true); });
    return () => { annule = true; try { lecteur?.destroy?.(); } catch { /* lecteur déjà retiré */ } };
  }, [video.id, video.start, secours]);

  return (
    <div>
      <div className="relative aspect-video w-full bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full">
        {secours ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?rel=0&playsinline=1${video.start ? `&start=${video.start}` : ""}`}
            title={titre}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div ref={zone} className="h-full w-full" />
        )}
      </div>
      {erreur && (
        <p role="alert" className="flex items-start gap-2 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{erreur}
        </p>
      )}
    </div>
  );
}
