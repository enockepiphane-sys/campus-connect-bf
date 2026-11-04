import { useEffect, useRef, useState } from "react";
import posterImg from "@/assets/graduate-walk-poster.webp";
import walkVideo from "@/assets/graduate-walk.webm";
import walkSafari from "@/assets/graduate-walk-safari.webp";

// Diplômé de l'accueil : il marche sur place (vrai cycle de marche),
// soulève son chapeau pour saluer puis le remet. Boucle continue, fond transparent.
//
// - Chrome, Edge, Firefox, Android : vidéo WebM transparente (légère, 24 images/s).
// - Safari / iPhone / iPad : ces navigateurs n'affichent pas la transparence des
//   vidéos WebM, on utilise donc une image animée WebP transparente.
// - « Réduire les animations » activé, ou avant le chargement : image fixe.

type Mode = "fixe" | "video" | "image";

function choisirMode(): Mode {
  if (typeof window === "undefined") return "fixe";
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return "fixe";
  const ua = navigator.userAgent;
  const estIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const estSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg\/|OPR|Android/.test(ua);
  return estIOS || estSafari ? "image" : "video";
}

const ALT =
  "Jeune diplômé universitaire africain qui marche fièrement et salue en soulevant son chapeau";

export function AvatarMarche({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("fixe");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMode(choisirMode());
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (mode !== "video" || !v) return;
    v.muted = true;
    v.play().catch(() => setMode("image"));
  }, [mode]);

  if (mode === "video") {
    return (
      <video
        ref={videoRef}
        className={className}
        width={244}
        height={560}
        poster={posterImg}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label={ALT}
        onError={() => setMode("image")}
      >
        <source src={walkVideo} type="video/webm" />
      </video>
    );
  }

  return (
    <img
      src={mode === "image" ? walkSafari : posterImg}
      alt={ALT}
      width={244}
      height={560}
      decoding="async"
      className={className}
    />
  );
}
