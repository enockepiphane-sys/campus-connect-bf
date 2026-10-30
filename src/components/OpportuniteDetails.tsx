import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { candidatureHref, deadlineState, type Opportunite } from "@/lib/opportunites-model";
export function OpportuniteDetails({ offre, onClose }: { offre: Opportunite | null; onClose: () => void }) {
  const href = offre ? candidatureHref(offre.candidature) : null;
  return <Dialog open={Boolean(offre)} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle className="break-words">{offre?.titre}</DialogTitle><DialogDescription className="break-words">{offre?.organisme} · {offre?.categorie}</DialogDescription></DialogHeader>
    {offre && <div className="space-y-5 break-words"><section><h3 className="font-semibold">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm">{offre.description}</p></section><section><h3 className="font-semibold">Conditions</h3><p className="mt-2 whitespace-pre-wrap text-sm">{offre.conditions}</p></section><p className="text-sm font-medium">Date limite : {new Date(offre.date_limite + "T12:00:00Z").toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "UTC" })}</p><section><h3 className="font-semibold">Candidature</h3>{deadlineState(offre.date_limite) === "expired" && <p className="my-2 text-sm text-muted-foreground">La date limite est dépassée.</p>}{href ? <Button asChild variant="outline" className="mt-3"><a href={href} target="_blank" rel="noopener noreferrer">Site de candidature<ExternalLink /></a></Button> : <p className="mt-2 whitespace-pre-wrap text-sm">{offre.candidature}</p>}</section></div>}
  </DialogContent></Dialog>;
}
