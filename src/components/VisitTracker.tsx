import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackVisit } from "@/lib/visites";
import { isStandalone } from "@/lib/pwa";
import { memoriserRef, signalerActivite } from "@/lib/parrainage";

// Compte les visiteurs de façon anonyme : un appareil = un visiteur (voir lib/visites.ts).
export function VisitTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Parrainage : mémorise un éventuel ?ref=CODE et signale l'activité (validation des filleuls).
    memoriserRef(new URLSearchParams(window.location.search).get("ref"));
    void signalerActivite().catch(() => undefined);
    if (pathname.startsWith("/super-admin")) return;
    trackVisit("site");
    if (pathname.startsWith("/revision-ia")) trackVisit("revision-ia");
    else if (pathname === "/opportunites" || pathname.startsWith("/opportunites/")) trackVisit("opportunites");
    else if (pathname.startsWith("/bibliotheque")) trackVisit("bibliotheque");
  }, [pathname]);

  useEffect(() => {
    const onInstalled = () => trackVisit("installation", "device");
    window.addEventListener("appinstalled", onInstalled);
    if (isStandalone()) trackVisit("installation", "device");
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return null;
}
