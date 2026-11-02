import { useState, type ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck, BookOpen, CheckCircle2, Star, EyeOff, FileText, Flag, Home, LogIn, MapPin, MessageCircle, Package, Phone, Plus, RotateCcw,
  Search, ShieldAlert, ShoppingBag, Trash2, User, Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CATEGORIES_MARCHE, MOTIFS, TYPES_ANNONCE, deleteAnnonce, formatPrix, getContact, listAnnonces, mesAnnonces, photoUrl,
  setStatut, signaler, telLink, tempsEcoule, whatsappLink, type Annonce, type Motif,
} from "@/lib/marche";
import { MarchePublier } from "./MarchePublier";
import { MarchePaiement } from "./MarchePaiement";
import { BannieresDefilantes } from "./BannieresDefilantes";
import { estActif, listProsActifs, trierALaUne } from "@/lib/marche-monetisation";

const ICONES: Record<string, ComponentType<{ className?: string }>> = {
  "Livres": BookOpen,
  "Documents & cours": FileText,
  "Services": Wrench,
  "Colocation & logement": Home,
  "Matériel & autres": Package,
};
const couleurDuType = (t: string) => TYPES_ANNONCE.find((x) => x.value === t)?.color ?? "#0F8A44";
const libelleDuType = (t: string) => TYPES_ANNONCE.find((x) => x.value === t)?.court ?? t;

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

export function MarcheList() {
  const cache = useQueryClient();
  const session = useQuery({
    queryKey: ["marche-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session?.user.id ?? null,
  });
  const userId = session.data ?? null;
  const signedIn = Boolean(userId);
  const annonces = useQuery({ queryKey: ["marche-annonces"], queryFn: listAnnonces });
  const pros = useQuery({ queryKey: ["marche-pros"], queryFn: listProsActifs, staleTime: 5 * 60_000 });
  const [paiement, setPaiement] = useState<{ offre: "une" | "pro"; annonce?: Annonce } | null>(null);
  const miennes = useQuery({ queryKey: ["marche-mes-annonces", userId], queryFn: mesAnnonces, enabled: signedIn });

  const [onglet, setOnglet] = useState<"toutes" | "miennes">("toutes");
  const [type, setType] = useState("");
  const [categorie, setCategorie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [choisie, setChoisie] = useState<Annonce | null>(null);
  const [publier, setPublier] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);

  const source = onglet === "miennes" ? miennes.data ?? [] : annonces.data ?? [];
  const q = recherche.toLocaleLowerCase("fr");
  const filtrees = trierALaUne(source).filter(
    (a) =>
      (!type || a.type_annonce === type) &&
      (!categorie || a.categorie === categorie) &&
      `${a.titre} ${a.description} ${a.ville} ${a.universite ?? ""}`.toLocaleLowerCase("fr").includes(q),
  );
  const chargement = onglet === "miennes" ? miennes.isPending : annonces.isPending;
  const echec = onglet === "miennes" ? miennes.error : annonces.error;

  function rafraichir() {
    void cache.invalidateQueries({ queryKey: ["marche-annonces"] });
    void cache.invalidateQueries({ queryKey: ["marche-mes-annonces"] });
  }
  async function agir(a: Annonce, action: "terminer" | "reactiver" | "supprimer") {
    if (action === "supprimer" && !window.confirm("Supprimer définitivement cette annonce ?")) return;
    setEnCours(a.id);
    setErreur("");
    try {
      if (action === "supprimer") await deleteAnnonce(a);
      else await setStatut(a.id, action === "terminer" ? "terminee" : "active");
      rafraichir();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm font-semibold" role="tablist" aria-label="Affichage">
          <button type="button" role="tab" aria-selected={onglet === "toutes"} onClick={() => setOnglet("toutes")}
            className={`rounded-full px-4 py-1.5 transition ${onglet === "toutes" ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted"}`}>
            Toutes les annonces
          </button>
          {signedIn && (
            <button type="button" role="tab" aria-selected={onglet === "miennes"} onClick={() => setOnglet("miennes")}
              className={`rounded-full px-4 py-1.5 transition ${onglet === "miennes" ? "bg-foreground text-background" : "text-foreground/70 hover:bg-muted"}`}>
              Mes annonces
            </button>
          )}
        </div>
        {signedIn ? (
          <div className="flex flex-wrap gap-2">
          {!pros.data?.has(userId ?? "") && (
            <Button variant="outline" onClick={() => setPaiement({ offre: "pro" })}>
              <BadgeCheck />
              Devenir Vendeur Pro
            </Button>
          )}
          <Button onClick={() => setPublier(true)}>
            <Plus />
            Publier une annonce
          </Button>
          </div>
        ) : (
          <Button asChild>
            <Link to="/connexion-espaces" search={{ retour: "/marche" }}>
              <LogIn />
              Se connecter pour publier
            </Link>
          </Button>
        )}
      </div>

      <BannieresDefilantes />

      <div className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Rechercher une annonce" placeholder="Livre, cours, service, ville, université…" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="h-10 pl-9" />
        </div>
        <div role="group" aria-label="Type d’annonce" className="flex gap-2 overflow-x-auto pb-1">
          <Pastille actif={type === ""} couleur="#2b3a33" onClick={() => setType("")}>Tout</Pastille>
          {TYPES_ANNONCE.map((t) => (
            <Pastille key={t.value} actif={type === t.value} couleur={t.color} onClick={() => setType(type === t.value ? "" : t.value)}>{t.label}</Pastille>
          ))}
        </div>
        <div role="group" aria-label="Catégorie" className="flex gap-2 overflow-x-auto pb-1">
          <Pastille actif={categorie === ""} couleur="#2b3a33" onClick={() => setCategorie("")}>Toutes catégories</Pastille>
          {CATEGORIES_MARCHE.map((c) => (
            <Pastille key={c} actif={categorie === c} couleur="#9a3412" onClick={() => setCategorie(categorie === c ? "" : c)}>{c}</Pastille>
          ))}
        </div>
      </div>

      {(erreur || echec) && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{erreur || (echec instanceof Error ? echec.message : "Chargement impossible.")}</p>
          <Button variant="outline" onClick={rafraichir}>Réessayer</Button>
        </div>
      )}
      {chargement && <p role="status">Chargement des annonces…</p>}
      {!chargement && !echec && <p className="text-sm text-muted-foreground">{filtrees.length} annonce{filtrees.length !== 1 ? "s" : ""}</p>}
      {!chargement && !echec && filtrees.length === 0 && (
        <div className="py-12 text-center">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{onglet === "miennes" ? "Tu n’as pas encore d’annonce" : "Aucune annonce trouvée"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sois le premier à publier : un livre, un cours, un service ou une chambre à partager.</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtrees.map((a) => {
          const Icone = ICONES[a.categorie] ?? Package;
          const col = couleurDuType(a.type_annonce);
          const miennesCarte = onglet === "miennes";
          return (
            <article key={a.id} className={`flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${a.statut === "terminee" || a.masquee ? "opacity-70" : ""}`}>
              <button type="button" onClick={() => setChoisie(a)} className="relative block aspect-[4/3] w-full overflow-hidden text-left" aria-label={`Voir l’annonce ${a.titre}`}>
                {a.photos[0] ? (
                  <img src={photoUrl(a.photos[0])} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-white" style={{ background: `linear-gradient(135deg, ${col}, ${col}99)` }}>
                    <Icone className="h-14 w-14 opacity-90" />
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow" style={{ background: col }}>
                  {libelleDuType(a.type_annonce)}
                </span>
                {estActif(a.a_la_une_jusqu) && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-terracotta px-3 py-1 text-xs font-bold text-white shadow">
                    <Star className="h-3.5 w-3.5 fill-current" />À la une
                  </span>
                )}
                {(a.statut === "terminee" || a.masquee) && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                    {a.masquee ? "Masquée (modération)" : "Terminée"}
                  </span>
                )}
              </button>
              <div className="flex flex-1 flex-col p-4">
                <p className="font-display text-lg font-bold" style={{ color: col }}>{formatPrix(a.prix, a.type_annonce)}</p>
                <h2 className="mt-1 line-clamp-2 break-words font-display text-base font-bold">{a.titre}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{a.ville}{a.universite ? ` · ${a.universite}` : ""}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{a.categorie} · {tempsEcoule(a.created_at)}</p>
                {pros.data?.has(a.user_id) && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"><BadgeCheck className="h-4 w-4" />Vendeur Pro</p>
                )}
                {miennesCarte ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={enCours === a.id} onClick={() => void agir(a, a.statut === "active" ? "terminer" : "reactiver")}>
                      {a.statut === "active" ? <CheckCircle2 /> : <RotateCcw />}
                      {a.statut === "active" ? "Marquer terminée" : "Réactiver"}
                    </Button>
                    {a.statut === "active" && !a.masquee && (
                      <Button size="sm" variant="outline" onClick={() => setPaiement({ offre: "une", annonce: a })}>
                        <Star />
                        {estActif(a.a_la_une_jusqu) ? "Prolonger la une" : "Mettre à la une"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive" disabled={enCours === a.id} onClick={() => void agir(a, "supprimer")}>
                      <Trash2 />
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <Button className="mt-4 w-full text-white hover:brightness-110" style={{ background: col }} onClick={() => setChoisie(a)}>
                    Voir l’annonce
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <AnnonceDetails annonce={choisie} userId={userId} onClose={() => setChoisie(null)} />
      <MarchePaiement offre={paiement?.offre ?? null} annonce={paiement?.annonce ?? null} onClose={() => setPaiement(null)} />
      <MarchePublier open={publier} onClose={() => setPublier(false)} onPublished={() => { rafraichir(); setOnglet("miennes"); }} />
    </section>
  );
}

function Pastille({ actif, couleur, onClick, children }: { actif: boolean; couleur: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:brightness-95"
      style={actif ? { background: couleur, borderColor: couleur, color: "#fff" } : { background: `${couleur}14`, borderColor: `${couleur}55`, color: couleur }}
    >
      {children}
    </button>
  );
}

function AnnonceDetails({ annonce, userId, onClose }: { annonce: Annonce | null; userId: string | null; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);
  const [signalement, setSignalement] = useState(false);
  const [motif, setMotif] = useState<Motif>("arnaque");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const signedIn = Boolean(userId);
  const contact = useQuery({
    queryKey: ["marche-contact", annonce?.id],
    queryFn: () => getContact(annonce!.id),
    enabled: Boolean(annonce) && signedIn,
    retry: false,
  });

  function fermer() {
    setPhoto(0);
    setSignalement(false);
    setMessage("");
    setDetails("");
    onClose();
  }
  async function envoyerSignalement() {
    if (!annonce) return;
    setBusy(true);
    setMessage("");
    try {
      await signaler(annonce.id, motif, details);
      setSignalement(false);
      setDetails("");
      setMessage("Merci, ton signalement a été transmis à l’équipe de modération.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Signalement impossible.");
    } finally {
      setBusy(false);
    }
  }

  const col = annonce ? couleurDuType(annonce.type_annonce) : "#0F8A44";
  const proprietaire = Boolean(annonce && userId && annonce.user_id === userId);

  return (
    <Dialog open={Boolean(annonce)} onOpenChange={(o) => { if (!o) fermer(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="break-words">{annonce?.titre}</DialogTitle>
          <DialogDescription className="break-words">
            {annonce ? `${libelleDuType(annonce.type_annonce)} · ${annonce.categorie} · ${tempsEcoule(annonce.created_at)}` : ""}
          </DialogDescription>
        </DialogHeader>
        {annonce && (
          <div className="space-y-5 break-words">
            {annonce.photos.length > 0 && (
              <div className="space-y-2">
                <img src={photoUrl(annonce.photos[Math.min(photo, annonce.photos.length - 1)])} alt={`Photo de l’annonce ${annonce.titre}`} className="max-h-80 w-full rounded-2xl object-contain bg-muted" />
                {annonce.photos.length > 1 && (
                  <div className="flex gap-2">
                    {annonce.photos.map((p, i) => (
                      <button key={p} type="button" aria-label={`Photo ${i + 1}`} onClick={() => setPhoto(i)} className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${i === photo ? "border-primary" : "border-transparent"}`}>
                        <img src={photoUrl(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="font-display text-2xl font-bold" style={{ color: col }}>{formatPrix(annonce.prix, annonce.type_annonce)}</p>
            <p className="whitespace-pre-wrap text-sm">{annonce.description}</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" />{annonce.ville}{annonce.universite ? ` · ${annonce.universite}` : ""}</li>
              <li className="flex items-center gap-2"><User className="h-4 w-4" />{annonce.auteur_nom}</li>
            </ul>

            <section className="rounded-2xl border border-border bg-muted/40 p-4">
              <h3 className="font-semibold">Contacter {annonce.auteur_nom}</h3>
              {!signedIn ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-muted-foreground">Connecte-toi pour voir le numéro de contact.</p>
                  <Button asChild>
                    <Link to="/connexion-espaces" search={{ retour: "/marche" }}><LogIn />Se connecter</Link>
                  </Button>
                </div>
              ) : contact.isPending ? (
                <p className="mt-2 text-sm text-muted-foreground" role="status">Chargement…</p>
              ) : contact.error || !contact.data ? (
                <p className="mt-2 text-sm text-destructive" role="alert">Contact indisponible pour le moment.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild className="text-white hover:brightness-110" style={{ background: "#16a34a" }}>
                    <a href={whatsappLink(contact.data, annonce.titre)} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={telLink(contact.data)}><Phone />{contact.data}</a>
                  </Button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
              <h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" />Conseils de sécurité</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Rencontre-toi dans un lieu public, de préférence sur le campus.</li>
                <li>Vérifie l’article avant de payer et ne paie jamais à l’avance.</li>
                <li>CampusLink n’intervient dans aucun paiement ni aucune livraison.</li>
              </ul>
            </section>

            {message && <p role="status" className="text-sm text-primary">{message}</p>}

            {signedIn && !proprietaire && (
              <div>
                {!signalement ? (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setSignalement(true)}>
                    <Flag />Signaler cette annonce
                  </Button>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-border p-4">
                    <select aria-label="Motif du signalement" className={selectClass} value={motif} onChange={(e) => setMotif(e.target.value as Motif)}>
                      {MOTIFS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                    </select>
                    <Textarea rows={3} maxLength={500} placeholder="Précisions (facultatif)" value={details} onChange={(e) => setDetails(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSignalement(false)} disabled={busy}>Annuler</Button>
                      <Button size="sm" onClick={() => void envoyerSignalement()} disabled={busy}>Envoyer le signalement</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {annonce.masquee && proprietaire && (
              <p className="flex items-center gap-2 text-sm text-destructive"><EyeOff className="h-4 w-4" />Cette annonce est masquée par la modération.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
