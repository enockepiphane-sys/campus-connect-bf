// Edge Function : send-push
//
// Envoie une notification push (Web Push / VAPID) à tous les appareils abonnés (table push_subscriptions).
// Réservée au super admin : le JWT de l'appelant est vérifié, puis son rôle via is_super_admin.
//
// Secrets Supabase à définir (Project Settings → Edge Functions → Secrets, ou `supabase secrets set`) :
//   VAPID_PUBLIC_KEY   = la clé publique déjà utilisée dans src/lib/push-notifications.ts
//   VAPID_PRIVATE_KEY  = la clé privée correspondante (NE JAMAIS la mettre dans le code du site)
//   VAPID_SUBJECT      = mailto:contact@votre-domaine.bf   (facultatif)

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Authentification requise." }, 401);

    const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Session invalide." }, 401);

    const { data: isSuperAdmin } = await caller.rpc("is_super_admin", { _user_id: userData.user.id });
    if (!isSuperAdmin) return json({ error: "Réservé au super administrateur." }, 403);

    const { titre, message, lien } = await req.json();
    if (typeof titre !== "string" || typeof message !== "string" || !titre.trim() || !message.trim()) {
      return json({ error: "Titre et message requis." }, 400);
    }

    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!publicKey || !privateKey) {
      return json({ error: "Clés VAPID non configurées sur le serveur.", envoyes: 0, echecs: 0 }, 500);
    }
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@campuslink.bf", publicKey, privateKey);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: abonnes, error } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth");
    if (error) return json({ error: error.message }, 500);

    const payload = JSON.stringify({
      title: titre.trim().slice(0, 120),
      body: message.trim().slice(0, 500),
      url: typeof lien === "string" && lien.startsWith("/") ? lien : "/",
      type: "plateforme",
    });

    let envoyes = 0;
    let echecs = 0;
    const perimes: string[] = [];
    await Promise.all(
      (abonnes ?? []).map(async (a) => {
        try {
          await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, payload);
          envoyes++;
        } catch (e) {
          echecs++;
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) perimes.push(a.id); // abonnement expiré : on le nettoie
        }
      }),
    );
    if (perimes.length) await admin.from("push_subscriptions").delete().in("id", perimes);

    return json({ envoyes, echecs, total: abonnes?.length ?? 0 });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erreur inconnue." }, 500);
  }
});
