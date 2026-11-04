import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Briefcase, Brain, Download, RefreshCw, Smartphone, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { describeAgent, fetchDetail, fetchStats, isNoTrack, resetVisits, setNoTrack, type StatsPoint } from "@/lib/visites";

type Range = "jour" | "semaine" | "mois";

const TOOLS: Record<string, { label: string; color: string; Icon: typeof Brain }> = {
  "revision-ia": { label: "Révision & IA", color: "#0F8A44", Icon: Brain },
  opportunites: { label: "Opportunités", color: "#ea580c", Icon: Briefcase },
  bibliotheque: { label: "Bibliothèque", color: "#167d78", Icon: BookOpen },
};

function label(range: Range, iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  if (range === "mois") return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" });
  if (range === "semaine") return "Sem. " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
}

function Kpi({ title, value, Icon, color }: { title: string; value: number; Icon: typeof Users; color: string }) {
  return (
    <div className="card-glass rounded-2xl p-4 sm:p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: color }}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-display text-3xl font-extrabold tabular-nums sm:text-4xl">{value.toLocaleString("fr-FR")}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

export function VisiteursPanel() {
  const cache = useQueryClient();
  const stats = useQuery({ queryKey: ["stats-visiteurs"], queryFn: fetchStats, refetchOnWindowFocus: false });
  const [showDetail, setShowDetail] = useState(false);
  const detail = useQuery({ queryKey: ["visiteurs-detail"], queryFn: fetchDetail, enabled: showDetail, refetchOnWindowFocus: false });
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetError, setResetError] = useState("");
  const [ignored, setIgnored] = useState(false);
  // L'appareil du super administrateur n'est plus compté dès qu'il ouvre ce tableau de bord.
  useEffect(() => {
    setNoTrack(true);
    setIgnored(isNoTrack());
  }, []);
  async function doReset() {
    setBusy(true);
    setResetError("");
    try {
      await resetVisits();
      await Promise.all([cache.invalidateQueries({ queryKey: ["stats-visiteurs"] }), cache.invalidateQueries({ queryKey: ["visiteurs-detail"] })]);
      setConfirmReset(false);
    } catch (e) {
      setResetError(e instanceof Error ? e.message : "La remise à zéro a échoué.");
    } finally {
      setBusy(false);
    }
  }
  const rows = detail.data ?? [];
  const bots = rows.filter((r) => describeAgent(r.agent).bot).length;
  const fmt = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const [range, setRange] = useState<Range>("jour");
  const s = stats.data;
  const series: StatsPoint[] = s ? (range === "jour" ? s.par_jour : range === "semaine" ? s.par_semaine : s.par_mois) : [];
  const max = Math.max(1, ...series.map((p) => p.visiteurs));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Visiteurs du site</h2>
          <p className="text-sm text-muted-foreground">
            Seuls les utilisateurs ayant ouvert au moins leur compte primaire sont comptés. Un utilisateur = un compte, compté une seule fois par période.
            {s?.depuis ? ` Comptage depuis le ${new Date(s.depuis).toLocaleDateString("fr-FR", { dateStyle: "long" })}.` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => void stats.refetch()} disabled={stats.isFetching}>
          <RefreshCw className={stats.isFetching ? "animate-spin" : ""} />
          Actualiser
        </Button>
      </div>

      {stats.isPending && <p role="status">Chargement des statistiques…</p>}
      {stats.error && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {stats.error.message}
        </p>
      )}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi title="Aujourd’hui" value={s.aujourdhui} Icon={Users} color="#0F8A44" />
            <Kpi title="7 derniers jours" value={s.sept_jours} Icon={Users} color="#167d78" />
            <Kpi title="30 derniers jours" value={s.trente_jours} Icon={Users} color="#c08a1e" />
            <Kpi title="Depuis le début" value={s.total} Icon={Users} color="#2b3a33" />
            <div className="col-span-2 lg:col-span-1">
              <Kpi title="Installations de l’application" value={s.installations} Icon={Smartphone} color="#ea580c" />
            </div>
          </div>

          <div className="card-glass rounded-2xl p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold">Évolution des visiteurs</h3>
              <div className="flex gap-1.5">
                {(["jour", "semaine", "mois"] as Range[]).map((r) => (
                  <button key={r} type="button" onClick={() => setRange(r)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${range === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {r === "jour" ? "Par jour" : r === "semaine" ? "Par semaine" : "Par mois"}
                  </button>
                ))}
              </div>
            </div>
            {series.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Pas encore de données sur cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex h-56 min-w-max items-end gap-2 pb-1 sm:gap-3">
                  {series.map((p) => (
                    <div key={p.periode} className="flex w-9 flex-col items-center justify-end gap-1 sm:w-11" style={{ height: "100%" }}>
                      <span className="text-xs font-bold tabular-nums">{p.visiteurs}</span>
                      <div className="w-full rounded-t-lg" style={{ height: `${Math.max(4, (p.visiteurs / max) * 150)}px`, background: "linear-gradient(180deg, #12A150, #0b6b36)" }} />
                      <span className="w-12 text-center text-[10px] leading-tight text-muted-foreground">{label(range, p.periode)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-glass rounded-2xl p-4 sm:p-6">
            <h3 className="mb-4 font-display text-lg font-bold">Visiteurs par outil</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
              {Object.entries(TOOLS).map(([key, t]) => {
                const row = s.outils.find((o) => o.page === key);
                return (
                  <div key={key} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: t.color }}>
                        <t.Icon className="h-4 w-4" />
                      </span>
                      <p className="font-display font-bold">{t.label}</p>
                    </div>
                    <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">{(row?.total ?? 0).toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-muted-foreground">visiteurs depuis le début</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      7 jours : <strong className="text-foreground">{row?.sept_jours ?? 0}</strong> · 30 jours : <strong className="text-foreground">{row?.trente_jours ?? 0}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-glass rounded-2xl p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">Vérifier les visiteurs</h3>
                <p className="text-sm text-muted-foreground">Voir qui a été compté : appareil, première et dernière visite. Les robots sont repérés.</p>
              </div>
              <Button variant="outline" onClick={() => setShowDetail((v) => !v)}>
                {showDetail ? "Masquer le détail" : "Voir le détail"}
              </Button>
            </div>
            {showDetail && (
              <div className="mt-4">
                {detail.isPending && <p role="status">Chargement…</p>}
                {detail.error && (
                  <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                    {detail.error.message}
                  </p>
                )}
                {detail.data && (
                  <>
                    <p className="mb-3 text-sm">
                      <strong>{rows.length}</strong> appareil{rows.length > 1 ? "s" : ""} (100 derniers) dont <strong>{bots}</strong> robot{bots > 1 ? "s" : ""} ou visite{bots > 1 ? "s" : ""} automatique{bots > 1 ? "s" : ""}.
                    </p>
                    <div className="overflow-x-auto rounded-2xl border border-border">
                      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-muted/60">
                            <th className="px-3 py-2 font-semibold">Appareil</th>
                            <th className="px-3 py-2 font-semibold">Première visite</th>
                            <th className="px-3 py-2 font-semibold">Dernière</th>
                            <th className="px-3 py-2 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => {
                            const a = describeAgent(r.agent);
                            return (
                              <tr key={r.visiteur + r.premiere} className="border-t border-border">
                                <td className="px-3 py-2">
                                  <span className={a.bot ? "rounded-full bg-[#ea580c] px-2 py-0.5 text-xs font-bold text-white" : ""}>{a.label}</span>
                                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">{r.visiteur}</span>
                                </td>
                                <td className="px-3 py-2 tabular-nums">{fmt(r.premiere)}</td>
                                <td className="px-3 py-2 tabular-nums">{fmt(r.derniere)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{r.actions}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p className="flex min-w-0 flex-1 items-start gap-2">
              <Download className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Un même téléphone qui efface ses données ou change de navigateur peut être compté une seconde fois.
              {ignored ? " Cet appareil (le vôtre) n’est pas compté. Les robots ne sont plus comptés non plus." : ""}
            </p>
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              <Trash2 className="text-destructive" />
              Remettre à zéro
            </Button>
          </div>
        </>
      )}

      <AlertDialog open={confirmReset} onOpenChange={(o) => !o && !busy && setConfirmReset(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remettre le compteur à zéro ?</AlertDialogTitle>
            <AlertDialogDescription>Toutes les visites enregistrées seront effacées définitivement. Utile pour repartir de zéro avant de promouvoir le site, sans vos tests ni les robots.</AlertDialogDescription>
          </AlertDialogHeader>
          {resetError && <p role="alert" className="text-sm text-destructive">{resetError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void doReset(); }}>
              {busy ? "Remise à zéro…" : "Tout effacer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
