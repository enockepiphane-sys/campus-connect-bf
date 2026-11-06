import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type NotifPlateforme } from "@/lib/avis";
import { isPushSubscribed, isPushSupported, setupPushNotifications } from "@/lib/push-notifications";

// Cloche de l'accueil : messages envoyés par l'équipe CampusLink aux comptes inscrits.
// Visible uniquement quand l'utilisateur est connecté.
export function ClochePlateforme() {
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifPlateforme[]>([]);
  const [lues, setLues] = useState<Set<string>>(new Set());
  const [pushActif, setPushActif] = useState(true);
  const [pushMsg, setPushMsg] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const charger = useCallback(async (uid: string) => {
    const [{ data: n }, { data: l }] = await Promise.all([
      db.from("notifications_plateforme").select("id,titre,message,lien,created_at").order("created_at", { ascending: false }).limit(30),
      db.from("notifications_plateforme_lues").select("notification_id").eq("user_id", uid),
    ]);
    setItems((n as NotifPlateforme[]) ?? []);
    setLues(new Set(((l as { notification_id: string }[]) ?? []).map((x) => x.notification_id)));
  }, []);

  useEffect(() => {
    if (!userId) return;
    void charger(userId);
    void isPushSubscribed().then(setPushActif);
    const canal = supabase
      .channel("notifications-plateforme")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications_plateforme" }, () => { void charger(userId); })
      .subscribe();
    return () => { void supabase.removeChannel(canal); };
  }, [userId, charger]);

  if (!userId) return null;
  const nonLues = items.filter((n) => !lues.has(n.id));

  const marquerLue = async (id: string) => {
    if (lues.has(id)) return;
    setLues((p) => new Set(p).add(id));
    await db.from("notifications_plateforme_lues").insert({ notification_id: id, user_id: userId });
  };
  const toutLire = async () => {
    const rows = nonLues.map((n) => ({ notification_id: n.id, user_id: userId }));
    if (!rows.length) return;
    setLues(new Set(items.map((n) => n.id)));
    await db.from("notifications_plateforme_lues").insert(rows);
  };
  const activerPush = async () => {
    const r = await setupPushNotifications();
    if (r.status === "ok") { setPushActif(true); setPushMsg("Notifications activées sur cet appareil."); }
    else if (r.status === "denied") setPushMsg("Notifications bloquées : autorise-les dans les réglages du navigateur.");
    else if (r.status === "unsupported") setPushMsg("Ton navigateur ne gère pas les notifications push.");
    else setPushMsg("Activation impossible pour le moment.");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${nonLues.length ? ` (${nonLues.length} non lues)` : ""}`}
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-primary shadow-sm transition hover:bg-primary-soft"
      >
        <Bell className="h-5 w-5" />
        {isPushSupported() && !pushActif && nonLues.length === 0 && (
          <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-[#F0C419] ring-2 ring-surface" />
        )}
        {nonLues.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {nonLues.length > 9 ? "9+" : nonLues.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 top-[72px] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-xl sm:inset-x-auto sm:right-6 sm:w-96">
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
              <span className="text-sm font-bold">Notifications</span>
              <div className="flex items-center gap-3">
                {nonLues.length > 0 && <button type="button" onClick={toutLire} className="text-xs font-medium text-primary">Tout marquer lu</button>}
                <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
            </div>

            {isPushSupported() && !pushActif && (
              <button type="button" onClick={activerPush} className="mb-2 flex w-full items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-left text-xs font-semibold text-primary">
                <BellRing className="h-4 w-4 shrink-0" />Recevoir les notifications sur cet appareil
              </button>
            )}
            {pushMsg && <p className="mb-2 text-xs text-muted-foreground">{pushMsg}</p>}

            <div className="space-y-1">
              {items.map((n) => {
                const lue = lues.has(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { void marquerLue(n.id); if (n.lien) window.location.href = n.lien; }}
                    className={`block w-full rounded-xl p-2.5 text-left text-sm transition hover:bg-muted ${lue ? "" : "bg-primary-soft"}`}
                  >
                    <p className="font-semibold">{n.titre}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
                  </button>
                );
              })}
              {items.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Aucune notification pour le moment.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
