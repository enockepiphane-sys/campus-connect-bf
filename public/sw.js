// public/sw.js
//
// Service worker : reçoit les notifications push (Web Push / VAPID) et les affiche.
// Gère aussi le clic sur la notification pour ouvrir/focus la bonne page de l'app.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Réception d'un push envoyé par l'Edge Function send-push
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CampusLink-bf", body: event.data.text() };
  }

  const title = payload.title || "CampusLink-bf";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    data: { url: payload.url || "/" },
    tag: payload.type || "campuslink-notif",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notification : ouvre l'app sur la bonne page,
// ou remet le focus sur un onglet déjà ouvert si possible
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
