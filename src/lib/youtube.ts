// Analyse des liens YouTube (aucune dépendance : testable seule).
// On ne télécharge rien : on extrait seulement l'identifiant pour utiliser le lecteur intégré officiel.
export type YoutubeRef = { id: string; start: number };

const ID = /^[A-Za-z0-9_-]{11}$/;
const HOTES = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"]);

function secondes(valeur: string | null): number {
  if (!valeur) return 0;
  if (/^\d+$/.test(valeur)) return Number(valeur);
  const m = valeur.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

/** Reconnaît : watch?v=, youtu.be/, embed/, shorts/, live/, v/, liens de partage (?si=…), m./music./nocookie. */
export function parseYoutube(lien: string | null | undefined): YoutubeRef | null {
  if (!lien) return null;
  let url: URL;
  try { url = new URL(lien.trim().match(/^https?:\/\//i) ? lien.trim() : `https://${lien.trim()}`); } catch { return null; }
  if (!HOTES.has(url.hostname.toLowerCase())) return null;
  let id: string | null = null;
  if (url.hostname.toLowerCase() === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (url.pathname === "/watch") id = url.searchParams.get("v");
  else {
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    id = m ? m[1] : null;
  }
  if (!id || !ID.test(id)) return null;
  return { id, start: secondes(url.searchParams.get("t") ?? url.searchParams.get("start")) };
}

export const youtubeMiniature = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Messages affichés selon le code d'erreur renvoyé par l'API IFrame de YouTube. */
export function messageErreurYoutube(code: number): string {
  switch (code) {
    case 2: return "Le lien de cette vidéo est invalide. Signale-le à l’administrateur.";
    case 5: return "Cette vidéo ne peut pas être lue dans le lecteur de ton navigateur. Réessaie plus tard.";
    case 100: return "Cette vidéo est introuvable : elle a été supprimée ou rendue privée.";
    case 101:
    case 150: return "Le propriétaire de cette vidéo n’autorise pas sa lecture en dehors de YouTube. Elle ne peut pas être affichée dans CampusLink.";
    case 153: return "Le lecteur YouTube n’a pas pu s’afficher (vérification de l’origine). Recharge la page ; si le problème continue, contacte l’administrateur.";
    default: return "Cette vidéo n’a pas pu être lue. Vérifie ta connexion puis réessaie.";
  }
}
