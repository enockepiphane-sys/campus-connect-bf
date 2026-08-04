import { supabase } from "@/integrations/supabase/client";
import { getFirebaseApp, VAPID_KEY } from "@/lib/firebase";

export type PushSetupResult =
  | { status: "ok"; token: string }
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

/**
 * Demande la permission, récupère le token FCM et l'enregistre dans `device_tokens`.
 * Ne lève jamais d'exception : l'app continue de fonctionner sans notifications.
 */
export async function setupPushNotifications(): Promise<PushSetupResult> {
  try {
    if (!isPushSupported()) return { status: "unsupported" };

    const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
    if (!(await isSupported())) return { status: "unsupported" };

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : Notification.permission === "denied"
          ? "denied"
          : await Notification.requestPermission();

    if (permission !== "granted") return { status: "denied" };

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return { status: "error", reason: "Token FCM indisponible" };

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { status: "error", reason: "Utilisateur non connecté" };

    const { error } = await supabase
      .from("device_tokens")
      .upsert({ user_id: userId, token, platform: "web" }, { onConflict: "token" });
    if (error) return { status: "error", reason: error.message };

    return { status: "ok", token };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
