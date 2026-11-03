// Bouton de téléchargement soumis au parrainage (bibliothèque, cours et toute rubrique avec fichiers).
// La consultation en ligne (Lire / Voir / Regarder) n'utilise PAS ce bouton et reste toujours libre.
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { consommerTelechargement } from "@/lib/parrainage";

type Props = {
  url: string; // lien de téléchargement direct
  ressource: string; // identifiant stable, ex. "bibliotheque:<id>"
  label: string;
  className?: string;
  children: ReactNode;
};

export function BoutonTelechargement({ url, ressource, label, className, children }: Props) {
  const [busy, setBusy] = useState(false);
  const [bloque, setBloque] = useState<null | "quota" | "connexion" | "erreur">(null);

  async function telecharger() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await consommerTelechargement(ressource);
      if (r.ok) {
        const a = document.createElement("a");
        a.href = url;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        setBloque(r.raison === "connexion" ? "connexion" : r.raison === "quota" ? "quota" : "erreur");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={telecharger} aria-label={label} disabled={busy} className={className}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
      <Dialog open={bloque !== null} onOpenChange={(o) => !o && setBloque(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" />Téléchargement verrouillé</DialogTitle>
            <DialogDescription>
              {bloque === "connexion" && "Connecte-toi à ton compte CampusLink pour télécharger ce fichier."}
              {bloque === "erreur" && "Le téléchargement n'a pas pu être vérifié. Vérifie ta connexion puis réessaie."}
              {bloque === "quota" && (
                <>
                  La lecture en ligne reste gratuite et illimitée. Pour <strong>télécharger</strong>, invite tes amis avec ton lien
                  de parrainage : 3 inscriptions validées débloquent 1 téléchargement, 5 inscriptions en ajoutent 3.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {bloque === "quota" && (
            <Link to="/parrainage" className="btn-bf-primary w-full text-center" onClick={() => setBloque(null)}>
              Obtenir mon lien de parrainage
            </Link>
          )}
          {bloque === "connexion" && (
            <Link to="/connexion" search={{ retour: typeof window !== "undefined" ? window.location.pathname : "/" }} className="btn-bf-primary w-full text-center">
              Se connecter
            </Link>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
