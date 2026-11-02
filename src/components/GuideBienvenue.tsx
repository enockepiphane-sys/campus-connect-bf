import { useEffect, useState } from "react";
import { BookOpen, Briefcase, GraduationCap, ShoppingBag, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CLE = "campuslink-guide-vu";

const ETAPES = [
  { Icon: Sparkles, titre: "Bienvenue sur CampusLink 🇧🇫", texte: "Voici un petit tour de l’application. Tu peux le passer à tout moment." },
  { Icon: UserPlus, titre: "Un compte, une seule fois", texte: "Crée ton compte avec ton nom de profil, ton numéro de téléphone et un mot de passe. Ensuite l’application s’ouvre directement, sans te reconnecter." },
  { Icon: ShoppingBag, titre: "Marché étudiant", texte: "Achète, vends ou échange livres, cours, services et colocations. Tu peux aussi mettre ton annonce à la une ou devenir Vendeur Pro." },
  { Icon: BookOpen, titre: "Bibliothèque, cours et révision", texte: "Documents, cours en ligne, guide du bachelier et révision avec l’IA : tout est accessible depuis l’accueil." },
  { Icon: Briefcase, titre: "Opportunités", texte: "Bourses, stages, emplois et concours publiés pour les étudiants du Burkina Faso." },
  { Icon: GraduationCap, titre: "Espace Étudiant (établissements partenaires)", texte: "L’Espace Étudiant (notes, emploi du temps, annonces) est réservé aux étudiants pré-inscrits par leur établissement. Si ton établissement n’est pas encore partenaire de CampusLink, tu ne pourras pas t’y inscrire : utilise les autres fonctionnalités en attendant." },
];

export function GuideBienvenue() {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState(0);

  useEffect(() => {
    try { if (!window.localStorage.getItem(CLE)) setOuvert(true); } catch { /* stockage indisponible */ }
    const relancer = () => { setEtape(0); setOuvert(true); };
    window.addEventListener("campuslink:guide", relancer);
    return () => window.removeEventListener("campuslink:guide", relancer);
  }, []);

  function fermer() {
    try { window.localStorage.setItem(CLE, "1"); } catch { /* ignore */ }
    setOuvert(false);
  }
  const e = ETAPES[etape];
  const derniere = etape === ETAPES.length - 1;

  return (
    <Dialog open={ouvert} onOpenChange={(o) => { if (!o) fermer(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><e.Icon className="h-7 w-7" /></span>
          <DialogTitle className="text-center">{e.titre}</DialogTitle>
          <DialogDescription className="text-center text-base">{e.texte}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1.5" aria-label={`Étape ${etape + 1} sur ${ETAPES.length}`}>
          {ETAPES.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === etape ? "w-6 bg-primary" : "w-1.5 bg-foreground/20"}`} />)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={fermer}>Passer</Button>
          <div className="flex gap-2">
            {etape > 0 && <Button variant="outline" onClick={() => setEtape(etape - 1)}>Précédent</Button>}
            <Button onClick={() => (derniere ? fermer() : setEtape(etape + 1))}>{derniere ? "Terminer" : "Suivant"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function relancerGuide() {
  window.dispatchEvent(new Event("campuslink:guide"));
}
