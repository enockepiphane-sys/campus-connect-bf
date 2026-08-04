/* global importScripts, firebase */
// Service worker dédié aux notifications push (Firebase Cloud Messaging).
// Il ne met rien en cache : il sert uniquement à recevoir les messages en arrière-plan.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAJxWfcw68PCw8buaAhpmnUOe_AlKK5sRM",
  authDomain: "campuslink-a316f.firebaseapp.com",
  projectId: "campuslink-a316f",
  storageBucket: "campuslink-a316f.firebasestorage.app",
  messagingSenderId: "1008334272932",
  appId: "1:1008334272932:web:670e513f2ea8846664a931",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "CampusLink";
  const options = {
    body: payload?.notification?.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/etudiant";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
