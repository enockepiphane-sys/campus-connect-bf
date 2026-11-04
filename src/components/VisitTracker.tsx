import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { trackVisit } from "@/lib/visites";
import { isStandalone } from "@/lib/pwa";
import { supabase } from "@/integrations/supabase/client";
import { memoriserRef, signalerActivite } from "@/lib/parrainage";

// Compte les utilisateurs connectés (compte primaire au minimum) : un compte = un utilisateur (voir lib/visites.ts).
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

  // Compte aussi la personne dès qu'elle se connecte ou crée son compte (sans attendre un changement de page).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && !window.location.pathname.startsWith("/super-admin")) trackVisit("site");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onInstalled = () => trackVisit("installation", "device");
    window.addEventListener("appinstalled", onInstalled);
    if (isStandalone()) trackVisit("installation", "device");
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  return null;
}
