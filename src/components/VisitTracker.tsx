import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackVisit } from "@/lib/visites";
import { isStandalone } from "@/lib/pwa";

// Compte les visiteurs de façon anonyme : un appareil = un visiteur (voir lib/visites.ts).
export function VisitTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
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
