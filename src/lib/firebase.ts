import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyAJxWfcw68PCw8buaAhpmnUOe_AlKK5sRM",
  authDomain: "campuslink-a316f.firebaseapp.com",
  projectId: "campuslink-a316f",
  storageBucket: "campuslink-a316f.firebasestorage.app",
  messagingSenderId: "1008334272932",
  appId: "1:1008334272932:web:670e513f2ea8846664a931",
};

/** Clé publique VAPID utilisée pour le Web Push. */
export const VAPID_KEY =
  "BD0rlIiSfLSGVAZYKrQmpPmyrxHaDynoXadgnr5FbKWbFaR2Kjt0Obno5_s5P_dE1ec2qjPTrly8NSCo54kG5xk";

/** Initialise (une seule fois) l'app Firebase côté navigateur. */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
