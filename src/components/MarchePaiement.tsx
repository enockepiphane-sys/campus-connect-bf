import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { demanderPaiement, fcfa, getTarifs, montantOffre } from "@/lib/marche-monetisation";

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm md:text-sm";

// offre "une" : mettre une annonce à la une ; offre "pro" : abonnement mensuel Vendeur Pro.
export function MarchePaiement({ offre, annonce, onClose }: { offre: "une" | "pro" | null; annonce?: { id: string; titre: string } | null; onClose: () => void }) {
  const cache = useQueryClient();
  const tarifs = useQuery({ queryKey: ["marche-tarifs"], queryFn: getTarifs, enabled: Boolean(offre) });
  const [duree, setDuree] = useState<"semaine" | "mois">("semaine");
  const [operateur, setOperateur] = useState<"orange" | "moov">("orange");
  const [tel, setTel] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);

  function fermer() {
    setMessage(""); setEnvoye(false); setReference(""); onClose();
  }
  const t = tarifs.data;
  const montant = t && offre ? montantOffre(t, offre, offre === "pro" ? "mois" : duree) : 0;
  const numero = t ? (operateur === "orange" ? t.numero_orange : t.numero_moov) : "";

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!offre) return;
    setBusy(true); setMessage("");
    try {
      await demanderPaiement({ type_offre: offre, duree: offre === "pro" ? "mois" : duree, annonce_id: offre === "une" ? annonce?.id ?? null : null, operateur, telephone_payeur: tel, reference });
      setEnvoye(true);
      void cache.invalidateQueries({ queryKey: ["marche-mes-paiements"] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Envoi impossible.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={Boolean(offre)} onOpenChange={(o) => { if (!o) fermer(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {offre === "pro" ? <><BadgeCheck className="h-5 w-5 text-primary" />Devenir Vendeur Pro</> : <><Star className="h-5 w-5 text-terracotta" />Mettre à la une</>}
          </DialogTitle>
          <DialogDescription>
            {offre === "pro"
              ? `Badge « Vendeur Pro » et jusqu’à ${t?.pro_max_annonces ?? 100} annonces actives, pendant 30 jours.`
              : `Ton annonce${annonce ? ` « ${annonce.titre} »` : ""} s’affiche en haut du Marché étudiant.`}
          </DialogDescription>
        </DialogHeader>

        {tarifs.isPending && <p role="status">Chargement des tarifs…</p>}
        {tarifs.error && <p role="alert" className="text-sm text-destructive">{tarifs.error.message}</p>}

        {t && envoye && (
          <div className="space-y-3 text-sm">
            <p className="rounded-2xl bg-primary-soft p-4 text-primary">Demande envoyée ! L’administrateur vérifie ton paiement puis active ton offre (généralement dans la journée).</p>
            <Button className="w-full" onClick={fermer}>Fermer</Button>
          </div>
        )}

        {t && !envoye && (
          <form className="space-y-4" onSubmit={envoyer}>
            {offre === "une" && (
              <div className="space-y-2">
                <Label htmlFor="p-duree">Durée</Label>
                <select id="p-duree" className={selectClass} value={duree} onChange={(e) => setDuree(e.target.value as "semaine" | "mois")}>
                  <option value="semaine">1 semaine — {fcfa(t.une_semaine)}</option>
                  <option value="mois">1 mois — {fcfa(t.une_mois)}</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="p-op">Moyen de paiement</Label>
              <select id="p-op" className={selectClass} value={operateur} onChange={(e) => setOperateur(e.target.value as "orange" | "moov")}>
                <option value="orange">Orange Money</option>
                <option value="moov">Moov Money</option>
              </select>
            </div>
            <div className="rounded-2xl border border-border bg-muted/50 p-4 text-sm">
              <p>1. Envoie <strong>{fcfa(montant)}</strong> au numéro :</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-wide">{numero || "Numéro bientôt disponible"}</p>
              {t.nom_beneficiaire && <p className="text-muted-foreground">Bénéficiaire : {t.nom_beneficiaire}</p>}
              <p className="mt-2">2. Remplis le formulaire ci-dessous avec la référence reçue par SMS.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-tel">Numéro qui a payé</Label>
              <Input id="p-tel" type="tel" inputMode="tel" required value={tel} onChange={(e) => setTel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-ref">Référence de la transaction</Label>
              <Input id="p-ref" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex. PP231104.1234.A56789" />
            </div>
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="w-full" disabled={busy || !numero}>{busy ? "Envoi…" : "J’ai payé, envoyer ma demande"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
