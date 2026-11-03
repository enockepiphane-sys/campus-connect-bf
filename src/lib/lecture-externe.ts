// Analyse des liens externes de la bibliothèque (aucune dépendance : testable seule).
// Principe : on n'intègre QUE des lecteurs officiels de plateformes connues, ou un fichier direct (PDF, vidéo, image).
// Tout autre site n'est jamais affiché dans un cadre : il s'ouvre sur le site d'origine, ce qui respecte
// les restrictions d'intégration des plateformes et les droits des auteurs. Rien n'est copié ni téléchargé.
import { parseYoutube, type YoutubeRef } from "./youtube";

export type Lecture =
  | { kind: "youtube"; video: YoutubeRef }
  | { kind: "iframe"; src: string; fournisseur: string; format: "video" | "page" }
  | { kind: "pdf"; src: string }
  | { kind: "video"; src: string }
  | { kind: "image"; src: string }
  | { kind: "externe" };

export type LienAnalyse = { ok: true; url: string; hote: string; lecture: Lecture; integrable: boolean; fournisseur: string } | { ok: false; erreur: string };

const ID_DRIVE = /^[A-Za-z0-9_-]{10,}$/;
const ID_ARCHIVE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,150}$/;
const hoteSimple = (h: string) => h.toLowerCase().replace(/^www\./, "");
export const hoteDe = (lien: string): string => { try { return hoteSimple(new URL(lien).hostname); } catch { return ""; } };

function lectureDe(url: URL): { lecture: Lecture; fournisseur: string } {
  const hote = hoteSimple(url.hostname);
  const chemin = url.pathname;

  const yt = parseYoutube(url.toString());
  if (yt) return { lecture: { kind: "youtube", video: yt }, fournisseur: "YouTube" };

  if (hote === "vimeo.com" || hote === "player.vimeo.com") {
    const m = chemin.match(/^\/(?:video\/)?(\d+)(?:\/([A-Za-z0-9]+))?/);
    if (m) {
      const h = m[2] ?? url.searchParams.get("h");
      return { lecture: { kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}${h ? `?h=${encodeURIComponent(h)}` : ""}`, fournisseur: "Vimeo", format: "video" }, fournisseur: "Vimeo" };
    }
  }

  if (hote === "dailymotion.com" || hote === "dai.ly") {
    const m = hote === "dai.ly" ? chemin.match(/^\/([A-Za-z0-9]+)/) : chemin.match(/^\/video\/([A-Za-z0-9]+)/);
    if (m) return { lecture: { kind: "iframe", src: `https://www.dailymotion.com/embed/video/${m[1]}`, fournisseur: "Dailymotion", format: "video" }, fournisseur: "Dailymotion" };
  }

  // Google Drive : fichier partagé en « Tous les utilisateurs disposant du lien » (PDF, livre, vidéo…)
  if (hote === "drive.google.com") {
    const m = chemin.match(/^\/file\/d\/([A-Za-z0-9_-]+)/);
    const id = m?.[1] ?? (chemin === "/open" || chemin === "/uc" ? url.searchParams.get("id") : null);
    if (id && ID_DRIVE.test(id)) return { lecture: { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview`, fournisseur: "Google Drive", format: "page" }, fournisseur: "Google Drive" };
  }

  // Internet Archive : livres du domaine public et fonds en libre accès
  if (hote === "archive.org") {
    const m = chemin.match(/^\/(?:details|embed)\/([^/?#]+)/);
    if (m && ID_ARCHIVE.test(m[1])) return { lecture: { kind: "iframe", src: `https://archive.org/embed/${m[1]}`, fournisseur: "Internet Archive", format: "page" }, fournisseur: "Internet Archive" };
  }

  // Fichiers directs
  const ext = chemin.toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1];
  if (ext === "pdf") return { lecture: { kind: "pdf", src: url.toString() }, fournisseur: hote };
  if (ext && ["mp4", "webm", "mov"].includes(ext)) return { lecture: { kind: "video", src: url.toString() }, fournisseur: hote };
  if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) return { lecture: { kind: "image", src: url.toString() }, fournisseur: hote };

  return { lecture: { kind: "externe" }, fournisseur: hote };
}

/** Vérifie un lien saisi par l'administrateur et dit comment il sera lu dans CampusLink. */
export function analyserLien(saisie: string | null | undefined): LienAnalyse {
  const brut = (saisie ?? "").trim();
  if (!brut) return { ok: false, erreur: "Collez le lien du contenu." };
  if (brut.length > 2000) return { ok: false, erreur: "Ce lien est trop long." };
  if (/^http:\/\//i.test(brut)) return { ok: false, erreur: "Le lien doit commencer par https:// (les liens http ne sont pas sécurisés)." };
  let url: URL;
  try { url = new URL(/^https:\/\//i.test(brut) ? brut : `https://${brut}`); } catch { return { ok: false, erreur: "Ce lien n’est pas valide." }; }
  if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return { ok: false, erreur: "Ce lien n’est pas valide." };
  const { lecture, fournisseur } = lectureDe(url);
  return { ok: true, url: url.toString(), hote: hoteSimple(url.hostname), lecture, integrable: lecture.kind !== "externe", fournisseur };
}

/** Libellé court du type de contenu pour l'étiquette de la carte. */
export function etiquetteLien(lecture: Lecture): string {
  switch (lecture.kind) {
    case "youtube":
    case "video": return "Vidéo";
    case "pdf": return "PDF";
    case "image": return "Photo";
    case "iframe": return lecture.format === "video" ? "Vidéo" : "Lecture en ligne";
    default: return "Lien";
  }
}
