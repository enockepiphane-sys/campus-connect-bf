import { supabase } from "@/integrations/supabase/client";

// Clé publique VAPID (peut être exposée côté client sans risque)
const VAPID_PUBLIC_KEY = "BLzp0wqV2p_VlGUebTpJi9nHmiPL1HO5DS-wG3L71avEZmaWu-gHNtsM55LMWLYViuyNWeeqGbMujOkbsxUw5z0";

export type PushSetupResult =
  | { status: "ok" }
  | { status: "denied" | "unsupported" | "error"; reason?: string };

/** Le navigateur peut-il recevoir des notifications push ? */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** L'utilisateur est-il actuellement abonné aux notifications sur cet appareil ? */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (!existing) return false; // aucun SW enregistré → pas d'abonnement possible
    const sub = await existing.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Demande la permission, crée un abonnement push natif (PushManager)
 * et l'enregistre dans `push_subscriptions`. Ne lève jamais d'exception :
 * l'app continue de fonctionner sans notifications en cas d'échec.
 */
export async function setupPushNotifications(): Promise<PushSetupResult> {
  try {
    if (!isPushSupported()) return { status: "unsupported" };

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : Notification.permission === "denied"
          ? "denied"
          : await Notification.requestPermission();

    if (permission !== "granted") return { status: "denied" };

    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const raw = subscription.toJSON();
    const endpoint = raw.endpoint;
    const p256dh = raw.keys?.p256dh;
    const auth = raw.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return { status: "error", reason: "Abonnement push incomplet" };
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { status: "error", reason: "Utilisateur non connecté" };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ user_id: userId, endpoint, p256dh, auth }, { onConflict: "endpoint" });
    if (error) return { status: "error", reason: error.message };

    return { status: "ok" };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Désactive les notifications push sur cet appareil (désabonne et nettoie la BDD). */
export async function disablePushNotifications(): Promise<PushSetupResult> {
  try {
    if (!isPushSupported()) return { status: "unsupported" };

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return { status: "ok" };

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }

    return { status: "ok" };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
