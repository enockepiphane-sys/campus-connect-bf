import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Briefcase, Brain, Download, RefreshCw, Smartphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchStats, type StatsPoint } from "@/lib/visites";

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
  const stats = useQuery({ queryKey: ["stats-visiteurs"], queryFn: fetchStats, refetchOnWindowFocus: false });
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
            Un visiteur = un téléphone ou navigateur, compté une seule fois par période.
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
            <div className="grid gap-3 sm:grid-cols-3">
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

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Download className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Un même téléphone qui efface ses données ou change de navigateur peut être compté une seconde fois. Les visites du super administrateur ne sont pas comptées.
          </p>
        </>
      )}
    </section>
  );
}
