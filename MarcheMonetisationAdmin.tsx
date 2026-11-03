import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, EyeOff, Megaphone, Trash2, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  basculerBanniere, creerBanniere, fcfa, getTarifs, listBannieresAdmin, listPaiementsAdmin, saveTarifs, supprimerBanniere,
  traiterPaiement, type Tarifs,
} from "@/lib/marche-monetisation";

const carte = "space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm";

// Espace super administrateur : tarifs, numéros Orange/Moov, validation des paiements, bannières.
export function MarcheMonetisationAdmin() {
  return (
    <div className="space-y-6">
      <TarifsForm />
      <PaiementsListe />
      <BannieresGestion />
    </div>
  );
}

function TarifsForm() {
  const cache = useQueryClient();
  const q = useQuery({ queryKey: ["marche-tarifs"], queryFn: getTarifs });
  const [t, setT] = useState<Tarifs | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (q.data) setT(q.data); }, [q.data]);

  if (q.error) return <p role="alert" className="text-sm text-destructive">{q.error.message}</p>;
  if (!t) return <p role="status">Chargement des tarifs…</p>;

  const champNombre = (k: keyof Tarifs, label: string) => (
    <div className="space-y-1">
      <Label htmlFor={`t-${k}`}>{label}</Label>
      <Input id={`t-${k}`} type="number" min={0} value={String(t[k])} onChange={(e) => setT({ ...t, [k]: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
    </div>
  );
  const champTexte = (k: keyof Tarifs, label: string) => (
    <div className="space-y-1">
      <Label htmlFor={`t-${k}`}>{label}</Label>
      <Input id={`t-${k}`} value={String(t[k])} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
    </div>
  );

  return (
    <form className={carte} onSubmit={async (e) => {
      e.preventDefault(); setMsg("");
      try { await saveTarifs(t); setMsg("Tarifs enregistrés."); void cache.invalidateQueries({ queryKey: ["marche-tarifs"] }); }
      catch (err) { setMsg(err instanceof Error ? err.message : "Échec."); }
    }}>
      <h3 className="flex items-center gap-2 font-display text-lg font-bold"><Wallet className="h-5 w-5" />Tarifs & numéros de paiement</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        {champNombre("une_semaine", "À la une — 1 semaine (FCFA)")}
        {champNombre("une_mois", "À la une — 1 mois (FCFA)")}
        {champNombre("banniere_semaine", "Bannière — 1 semaine (FCFA)")}
        {champNombre("banniere_mois", "Bannière — 1 mois (FCFA)")}
        {champNombre("pro_mois", "Vendeur Pro — par mois (FCFA)")}
        {champNombre("pro_max_annonces", "Vendeur Pro — annonces actives max")}
        {champTexte("numero_orange", "Mon numéro Orange Money")}
        {champTexte("numero_moov", "Mon numéro Moov Money")}
        {champTexte("nom_beneficiaire", "Nom du bénéficiaire affiché")}
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <Button type="submit">Enregistrer</Button>
    </form>
  );
}

function PaiementsListe() {
  const cache = useQueryClient();
  const q = useQuery({ queryKey: ["marche-paiements-admin"], queryFn: listPaiementsAdmin });
  const [filtre, setFiltre] = useState<"en_attente" | "toutes">("en_attente");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const liste = (q.data ?? []).filter((p) => filtre === "toutes" || p.statut === "en_attente");

  async function agir(id: string, valider: boolean) {
    setBusy(id); setErr("");
    try {
      await traiterPaiement(id, valider);
      for (const k of ["marche-paiements-admin", "marche-annonces", "marche-pros", "marche-moderation-annonces"]) void cache.invalidateQueries({ queryKey: [k] });
    } catch (e) { setErr(e instanceof Error ? e.message : "Échec."); } finally { setBusy(null); }
  }

  return (
    <section className={carte}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Demandes de paiement</h3>
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={filtre} onChange={(e) => setFiltre(e.target.value as "en_attente" | "toutes")}>
          <option value="en_attente">En attente</option>
          <option value="toutes">Toutes</option>
        </select>
      </div>
      <p className="text-xs text-muted-foreground">Vérifie la référence et le montant sur ton téléphone (Orange / Moov Money) avant de valider. La validation active l’offre immédiatement.</p>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      {q.error && <p role="alert" className="text-sm text-destructive">{q.error.message}</p>}
      {q.isPending && <p role="status">Chargement…</p>}
      {!q.isPending && liste.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
      <ul className="space-y-3">
        {liste.map((p) => (
          <li key={p.id} className="rounded-2xl border border-border p-3 text-sm">
            <p className="font-semibold">
              {p.type_offre === "pro" ? "Vendeur Pro (1 mois)" : `À la une (${p.duree === "semaine" ? "1 semaine" : "1 mois"})`} — {fcfa(p.montant)}
            </p>
            <p className="text-muted-foreground">
              {p.operateur === "orange" ? "Orange Money" : "Moov Money"} · payé par {p.telephone_payeur} · réf. <strong className="text-foreground">{p.reference}</strong>
            </p>
            <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("fr-FR")} · {p.statut === "en_attente" ? "En attente" : p.statut === "validee" ? "Validée" : "Refusée"}</p>
            {p.statut === "en_attente" && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" disabled={busy === p.id} onClick={() => void agir(p.id, true)}><Check />Valider & activer</Button>
                <Button size="sm" variant="outline" className="text-destructive" disabled={busy === p.id} onClick={() => void agir(p.id, false)}><X />Refuser</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BannieresGestion() {
  const cache = useQueryClient();
  const q = useQuery({ queryKey: ["marche-bannieres-admin"], queryFn: listBannieresAdmin });
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ annonceur: "", message: "", telephone: "", lien: "", debut: today, fin: today });
  const [image, setImage] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const rafraichir = () => { void cache.invalidateQueries({ queryKey: ["marche-bannieres-admin"] }); void cache.invalidateQueries({ queryKey: ["marche-bannieres-actives"] }); };

  return (
    <section className={carte}>
      <h3 className="flex items-center gap-2 font-display text-lg font-bold"><Megaphone className="h-5 w-5" />Bannières publicitaires</h3>
      <p className="text-xs text-muted-foreground">Pour les imprimeries, cybercafés, résidences, boutiques, opérateurs… Encaisse le paiement, puis crée la bannière avec ses dates de diffusion. Elle défile sur l’accueil et le Marché.</p>
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setMsg("");
        try {
          if (f.fin < f.debut) throw new Error("La date de fin doit suivre la date de début.");
          await creerBanniere({ ...f, telephone: f.telephone || null, lien: f.lien || null }, image);
          setF({ annonceur: "", message: "", telephone: "", lien: "", debut: today, fin: today }); setImage(null);
          setMsg("Bannière créée."); rafraichir();
        } catch (err) { setMsg(err instanceof Error ? err.message : "Échec."); } finally { setBusy(false); }
      }}>
        <div className="space-y-1"><Label htmlFor="b-ann">Annonceur</Label><Input id="b-ann" required value={f.annonceur} onChange={(e) => setF({ ...f, annonceur: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="b-tel">Téléphone (facultatif)</Label><Input id="b-tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label htmlFor="b-msg">Message</Label><Input id="b-msg" required maxLength={160} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="b-lien">Lien (facultatif, https://…)</Label><Input id="b-lien" type="url" value={f.lien} onChange={(e) => setF({ ...f, lien: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="b-img">Image (facultatif)</Label><Input id="b-img" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /></div>
        <div className="space-y-1"><Label htmlFor="b-deb">Début</Label><Input id="b-deb" type="date" required value={f.debut} onChange={(e) => setF({ ...f, debut: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="b-fin">Fin</Label><Input id="b-fin" type="date" required value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></div>
        {msg && <p role="status" className="text-sm sm:col-span-2">{msg}</p>}
        <Button type="submit" disabled={busy} className="sm:col-span-2">{busy ? "Création…" : "Créer la bannière"}</Button>
      </form>
      {q.error && <p role="alert" className="text-sm text-destructive">{q.error.message}</p>}
      <ul className="space-y-2">
        {(q.data ?? []).map((b) => {
          const enCours = b.actif && b.debut <= today && b.fin >= today;
          return (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3 text-sm">
              <div className="min-w-0">
                <p className="break-words font-semibold">{b.annonceur} <span className="font-normal text-muted-foreground">· {enCours ? "en diffusion" : b.actif ? "programmée / expirée" : "désactivée"}</span></p>
                <p className="truncate text-muted-foreground">{b.message} · du {b.debut} au {b.fin}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => { await basculerBanniere(b.id, !b.actif); rafraichir(); }}>{b.actif ? <EyeOff /> : <Eye />}{b.actif ? "Désactiver" : "Activer"}</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={async () => { if (window.confirm(`Supprimer la bannière de ${b.annonceur} ?`)) { await supprimerBanniere(b); rafraichir(); } }}><Trash2 />Supprimer</Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
