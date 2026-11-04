import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CLE = "campuslink-guide-vu";

// Guide interactif : chaque étape pointe (surbrillance + bulle) sur l'élément réel de l'accueil
// repéré par l'attribut data-guide="…". Sans cible visible, la bulle s'affiche au centre.
const ETAPES: { cible?: string; titre: string; texte: string }[] = [
  { titre: "Bienvenue sur CampusLink 🇧🇫", texte: "Petit tour guidé : je te montre chaque fonctionnalité directement à l’écran. Tu peux passer à tout moment." },
  { cible: "menu", titre: "Le menu", texte: "Toujours visible en haut, même quand tu descends : il donne accès à toutes les pages." },
  { cible: "compte", titre: "Ton compte CampusLink", texte: "Crée ton compte une seule fois (nom, téléphone, mot de passe). Ensuite l’application s’ouvre directement." },
  { cible: "marche", titre: "Marché étudiant", texte: "Achète, vends ou échange livres, cours, services et colocations. Tu peux mettre ton annonce à la une." },
  { cible: "bibliotheque", titre: "Bibliothèque", texte: "Documents, mémoires et cours à consulter ou télécharger." },
  { cible: "cours", titre: "Cours en ligne", texte: "Des cours structurés à suivre à ton rythme depuis ton téléphone." },
  { cible: "revision", titre: "Révision & IA", texte: "Envoie tes cours en PDF ou en photo : IA CampusLink te prépare résumés, QCM et fiches." },
  { cible: "opportunites", titre: "Opportunités", texte: "Bourses, stages, emplois et concours publiés pour les étudiants du Burkina Faso." },
  { cible: "guide", titre: "Guide du bachelier", texte: "Filières, établissements et conseils pour bien choisir après le bac." },
  { cible: "une", titre: "Annonces à la une", texte: "Les annonces mises en avant du Marché défilent ici." },
  { cible: "espace-etudiant", titre: "Espace Étudiant", texte: "Notes, emploi du temps et annonces : réservé aux étudiants pré-inscrits par un établissement partenaire." },
];

type Rect = { top: number; left: number; width: number; height: number };

export function GuideBienvenue() {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    try { if (!window.localStorage.getItem(CLE)) setOuvert(true); } catch { /* stockage indisponible */ }
    const relancer = () => { setEtape(0); setOuvert(true); };
    window.addEventListener("campuslink:guide", relancer);
    return () => window.removeEventListener("campuslink:guide", relancer);
  }, []);

  const e = ETAPES[etape];

  const mesurer = useCallback(() => {
    if (!e.cible) return setRect(null);
    const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-guide="${e.cible}"]`)).find((x) => x.offsetParent !== null || x.getClientRects().length);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [e.cible]);

  useLayoutEffect(() => {
    if (!ouvert) return;
    if (e.cible) {
      const el = document.querySelector<HTMLElement>(`[data-guide="${e.cible}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    mesurer();
    const t = window.setTimeout(mesurer, 450);
    window.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => { window.clearTimeout(t); window.removeEventListener("scroll", mesurer); window.removeEventListener("resize", mesurer); };
  }, [ouvert, etape, e.cible, mesurer]);

  // Saute les étapes dont la cible n'existe pas sur la page (ex. aucune annonce à la une).
  function aller(sens: 1 | -1) {
    let n = etape + sens;
    while (n > 0 && n < ETAPES.length && ETAPES[n].cible && !document.querySelector(`[data-guide="${ETAPES[n].cible}"]`)) n += sens;
    if (n >= ETAPES.length) return fermer();
    setEtape(Math.max(0, n));
  }

  function fermer() {
    try { window.localStorage.setItem(CLE, "1"); } catch { /* ignore */ }
    setOuvert(false);
  }

  if (!ouvert) return null;
  const derniere = etape === ETAPES.length - 1;
  const M = 8;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const enBas = rect ? rect.top + rect.height / 2 < vh / 2 : false;
  const bulleStyle: React.CSSProperties = rect
    ? enBas
      ? { top: Math.min(rect.top + rect.height + M + 12, vh - 220) }
      : { bottom: Math.max(vh - rect.top + M + 12, 12) }
    : { top: "50%", transform: "translateY(-50%)" };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Guide de l’application">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-2xl ring-4 ring-primary transition-all duration-300"
          style={{ top: rect.top - M, left: rect.left - M, width: rect.width + M * 2, height: rect.height + M * 2, boxShadow: "0 0 0 9999px color-mix(in oklab, var(--foreground) 65%, transparent)" }}
        />
      ) : (
        <div className="fixed inset-0 bg-foreground/65" />
      )}
      <div className="fixed inset-x-4 mx-auto max-w-sm rounded-2xl bg-background p-5 shadow-2xl transition-all duration-300" style={bulleStyle}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Étape {etape + 1} / {ETAPES.length}</p>
        <h2 className="mt-1 font-display text-lg font-bold">{e.titre}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{e.texte}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={fermer}>Passer</Button>
          <div className="flex gap-2">
            {etape > 0 && <Button variant="outline" size="sm" onClick={() => aller(-1)}>Précédent</Button>}
            <Button size="sm" onClick={() => (derniere ? fermer() : aller(1))}>{derniere ? "Terminer" : "Suivant"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function relancerGuide() {
  window.dispatchEvent(new Event("campuslink:guide"));
}
