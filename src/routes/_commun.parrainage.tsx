import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Check, Copy, Crown, Download, Hourglass, Share2, ShieldCheck, Trophy, Users } from "lucide-react";
import { EspacesShell } from "@/components/EspacesShell";
import { getClassement, getMonParrainage, lienParrainage, PALIERS, prochainPalier } from "@/lib/parrainage";

export const Route = createFileRoute("/_commun/parrainage")({
  head: () => ({
    meta: [
      { title: "Parrainage — CampusLink" },
      { name: "description", content: "Invite tes amis sur CampusLink avec ton lien personnel, débloque des téléchargements et deviens Ambassadeur CampusLink." },
      { property: "og:title", content: "Parrainage — CampusLink" },
      { property: "og:description", content: "Invite tes amis, débloque des téléchargements et deviens Ambassadeur CampusLink." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <EspacesShell title="Parrainage">
      <Parrainage />
    </EspacesShell>
  ),
});

function Parrainage() {
  const moi = useQuery({ queryKey: ["mon-parrainage"], queryFn: getMonParrainage });
  const classement = useQuery({ queryKey: ["classement-parrains"], queryFn: () => getClassement(20) });
  const [copie, setCopie] = useState(false);

  if (moi.isLoading) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  if (moi.error || !moi.data) return <p className="py-10 text-center text-sm text-destructive">{(moi.error as Error)?.message ?? "Erreur"}</p>;

  const d = moi.data;
  const lien = lienParrainage(d.code);
  const prochain = prochainPalier(d.valides);
  const texte = `Rejoins-moi sur CampusLink, l'appli des étudiants du Burkina : bibliothèque, cours, opportunités… Inscris-toi avec mon lien : ${lien}`;

  async function copier() {
    await navigator.clipboard.writeText(lien).catch(() => undefined);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }
  async function partager() {
    if (navigator.share) await navigator.share({ title: "CampusLink", text: texte }).catch(() => undefined);
    else window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, "_blank", "noopener");
  }

  return (
    <div className="space-y-6">
      {d.ambassadeur && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <Crown className="h-8 w-8 shrink-0 text-primary" />
          <div>
            <p className="font-bold text-primary">{d.super_ambassadeur ? "Super Ambassadeur CampusLink" : "Ambassadeur CampusLink"}</p>
            <p className="text-sm text-muted-foreground">
              {d.super_ambassadeur ? "Bravo ! 20 personnes inscrites : tes téléchargements sont illimités." : "Merci ! Tu as fait inscrire au moins 10 personnes."}
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Mon lien de parrainage</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La lecture en ligne est toujours gratuite. Les <strong>téléchargements</strong> se débloquent en invitant de nouveaux utilisateurs.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-input bg-muted/40 p-2">
          <code className="min-w-0 flex-1 truncate px-2 text-sm">{lien}</code>
          <button type="button" onClick={copier} className="btn-bf-outline inline-flex items-center gap-1 text-sm">
            {copie ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copie ? "Copié" : "Copier"}
          </button>
        </div>
        <button type="button" onClick={partager} className="btn-bf-primary mt-3 inline-flex w-full items-center justify-center gap-2">
          <Share2 className="h-4 w-4" /> Partager mon lien
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Code : <strong>{d.code}</strong></p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat Icon={Users} valeur={d.valides} label="Validées" />
        <Stat Icon={Hourglass} valeur={d.en_attente} label="En attente" />
        <Stat Icon={Download} valeur={d.illimite ? "∞" : d.restants} label="Téléch. restants" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Mes récompenses</h2>
        {prochain && (
          <p className="mt-1 text-sm text-muted-foreground">
            Encore <strong>{prochain.seuil - d.valides}</strong> inscription(s) validée(s) pour : {prochain.titre}.
          </p>
        )}
        <ol className="mt-4 space-y-3">
          {PALIERS.map((p) => {
            const atteint = d.valides >= p.seuil;
            return (
              <li key={p.seuil} className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold ${atteint ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                  {atteint ? <Check className="h-4 w-4" /> : p.seuil}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${atteint ? "text-primary" : ""}`}>{p.titre}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (d.valides / p.seuil) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{Math.min(d.valides, p.seuil)}/{p.seuil}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Trophy className="h-5 w-5 text-primary" />Meilleurs parrains</h2>
        {classement.isLoading && <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>}
        {classement.data && classement.data.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Sois le premier du classement !</p>}
        <ul className="mt-3 divide-y divide-border">
          {classement.data?.map((l) => (
            <li key={l.rang} className={`flex items-center gap-3 py-2.5 ${l.moi ? "font-semibold text-primary" : ""}`}>
              <span className="w-7 text-center text-sm font-bold">{l.rang <= 3 ? ["🥇", "🥈", "🥉"][l.rang - 1] : l.rang}</span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {l.nom}{l.moi && " (moi)"}
                {l.super_ambassadeur ? (
                  <Crown className="ml-1 inline h-4 w-4 text-primary" aria-label="Super Ambassadeur CampusLink" />
                ) : l.ambassadeur ? (
                  <Award className="ml-1 inline h-4 w-4 text-primary" aria-label="Ambassadeur CampusLink" />
                ) : null}
              </span>
              <span className="text-sm">{l.valides}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-muted p-4 text-xs text-muted-foreground">
        <p className="mb-1 flex items-center gap-1 font-semibold text-foreground"><ShieldCheck className="h-4 w-4" />Inscriptions vérifiées</p>
        Une inscription est validée quand ton filleul revient sur CampusLink au moins 24 h après son inscription. Les doublons,
        les auto-inscriptions (même appareil ou même email) et les inscriptions en rafale ne sont pas comptés.
        {d.rejetes > 0 && <> Inscriptions refusées : {d.rejetes}.</>}
      </section>
    </div>
  );
}

function Stat({ Icon, valeur, label }: { Icon: typeof Users; valeur: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="mt-1 text-2xl font-bold">{valeur}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
