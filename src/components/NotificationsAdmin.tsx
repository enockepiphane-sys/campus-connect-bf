import { useEffect, useState } from "react";
import { BellRing, RefreshCw, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, type NotifPlateforme } from "@/lib/avis";

// Espace super admin : envoyer une notification à tous les comptes inscrits.
// 1) Le message apparaît dans la cloche de l'accueil (en direct). 2) Il est aussi poussé sur les appareils
// qui ont activé les notifications (Edge Function « send-push »).
export function NotificationsAdmin() {
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [lien, setLien] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null);
  const [liste, setListe] = useState<NotifPlateforme[]>([]);
  const [abonnes, setAbonnes] = useState<number | null>(null);

  const charger = async () => {
    const { data } = await db.from("notifications_plateforme").select("id,titre,message,lien,created_at").order("created_at", { ascending: false }).limit(50);
    setListe((data as NotifPlateforme[]) ?? []);
    const { data: n } = await db.rpc("push_abonnes_compte");
    setAbonnes(typeof n === "number" ? n : n != null ? Number(n) : null);
  };
  useEffect(() => { void charger(); }, []);

  const envoyer = async () => {
    const t = titre.trim(); const m = message.trim(); const l = lien.trim();
    if (t.length < 2 || m.length < 2) { setRetour({ ok: false, texte: "Renseigne un titre et un message." }); return; }
    if (l && !l.startsWith("/")) { setRetour({ ok: false, texte: "Le lien doit commencer par « / » (ex. /evenements)." }); return; }
    if (!window.confirm("Envoyer cette notification à tous les inscrits ?")) return;
    setEnvoi(true); setRetour(null);
    const { error } = await db.from("notifications_plateforme").insert({ titre: t, message: m, lien: l || null });
    if (error) { setEnvoi(false); setRetour({ ok: false, texte: "Envoi impossible. La migration SQL a-t-elle été exécutée ?" }); return; }

    // Notification push sur les appareils abonnés (échec non bloquant : la cloche a déjà le message).
    let suite = "";
    try {
      const { data, error: errPush } = await supabase.functions.invoke("send-push", { body: { titre: t, message: m, lien: l || undefined } });
      if (errPush) suite = " Push indisponible (fonction « send-push » à déployer).";
      else suite = ` Push envoyé à ${data?.envoyes ?? 0} appareil(s).`;
    } catch { suite = " Push indisponible."; }

    setEnvoi(false);
    setRetour({ ok: true, texte: `Notification envoyée dans la cloche des inscrits.${suite}` });
    setTitre(""); setMessage(""); setLien("");
    void charger();
  };

  const supprimer = async (n: NotifPlateforme) => {
    if (!window.confirm("Supprimer cette notification de la cloche des inscrits ?")) return;
    await db.from("notifications_plateforme").delete().eq("id", n.id);
    void charger();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><BellRing className="icon-terracotta h-6 w-6" />Notifications</h2>
        {abonnes !== null && <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{abonnes} appareil(s) avec push activé</span>}
      </div>

      <section className="card-glass space-y-3 rounded-2xl p-5">
        <h3 className="font-semibold">Nouvelle notification</h3>
        <input value={titre} onChange={(e) => setTitre(e.target.value.slice(0, 120))} placeholder="Titre (ex. Nouveau : les cours en ligne)" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 500))} rows={3} placeholder="Message" className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        <input value={lien} onChange={(e) => setLien(e.target.value.slice(0, 300))} placeholder="Page à ouvrir au clic (facultatif, ex. /evenements)" className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        {retour && <p role="status" className={`text-sm font-medium ${retour.ok ? "text-primary" : "text-destructive"}`}>{retour.texte}</p>}
        <button type="button" onClick={envoyer} disabled={envoi} className="btn-bf-primary disabled:opacity-60"><Send className="h-4 w-4" />{envoi ? "Envoi…" : "Envoyer à tous les inscrits"}</button>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Déjà envoyées</h3>
          <button type="button" onClick={charger} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><RefreshCw className="h-3.5 w-3.5" />Actualiser</button>
        </div>
        {liste.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucune notification envoyée.</p>}
        <ul className="space-y-2">
          {liste.map((n) => (
            <li key={n.id} className="card-glass flex items-start justify-between gap-3 rounded-2xl p-4">
              <div className="min-w-0">
                <p className="font-semibold">{n.titre}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("fr-FR")}{n.lien ? ` · ${n.lien}` : ""}</p>
              </div>
              <button type="button" onClick={() => supprimer(n)} aria-label="Supprimer" className="shrink-0 rounded-full p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
