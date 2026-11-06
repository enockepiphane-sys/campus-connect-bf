import { useEffect } from "react";
import { isPushSubscribed, isPushSupported, setupPushNotifications } from "@/lib/push-notifications";

const CLE = "cl-push-essai";
const DELAI_MS = 24 * 3600 * 1000; // si le visiteur ignore la demande, on réessaie au plus une fois par jour

// Abonnement automatique aux notifications pour TOUS les visiteurs (inscrits ou non).
// - Si l'autorisation est déjà accordée : l'appareil est abonné en silence, sans rien demander.
// - Sinon : au premier toucher/clic sur le site, on déclenche directement la fenêtre du téléphone
//   « Autoriser les notifications ? » (les navigateurs imposent ce geste et ce choix : on ne peut pas s'en passer).
// Aucun écran supplémentaire n'est affiché par le site.
export function InvitationNotifications() {
  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission === "denied") return; // refus définitif : le navigateur ne permet pas de redemander

    let retire = () => {};
    void (async () => {
      if (await isPushSubscribed()) return;

      if (Notification.permission === "granted") { void setupPushNotifications(); return; } // silencieux

      try { const t = Number(localStorage.getItem(CLE) ?? 0); if (t && Date.now() - t < DELAI_MS) return; } catch { /* stockage indisponible */ }

      const evenements = ["pointerdown", "keydown"] as const;
      const declencher = () => {
        retire();
        try { localStorage.setItem(CLE, String(Date.now())); } catch { /* ignoré */ }
        void setupPushNotifications();
      };
      retire = () => evenements.forEach((e) => window.removeEventListener(e, declencher));
      evenements.forEach((e) => window.addEventListener(e, declencher, { once: true, passive: true }));
    })();
    return () => retire();
  }, []);

  return null;
}
