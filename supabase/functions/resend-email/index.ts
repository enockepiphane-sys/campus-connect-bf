/**
 * Edge Function `set-initial-password`
 *
 * Définit le mot de passe d'un compte pour la toute première fois, juste
 * après que l'utilisateur ait cliqué sur son lien de confirmation
 * d'inscription (voir ConfirmerCompteFlow.tsx).
 *
 * Pourquoi ne pas utiliser supabase.auth.updateUser({ password }) côté
 * client : cet appel déclenche systématiquement l'email natif Supabase
 * "Your password was changed" (Votre mot de passe a été modifié), qui n'a
 * aucun sens ici puisqu'il s'agit d'une première définition, pas d'un
 * changement — l'utilisateur n'a jamais eu de mot de passe utilisable
 * avant cet instant (le compte a été créé avec un mot de passe aléatoire
 * généré côté serveur, voir etudiant.inscription.tsx / admin.inscription.tsx).
 *
 * L'API admin (auth.admin.updateUserById), utilisée ici avec la clé
 * service_role, ne déclenche PAS cet email : c'est la bonne façon de
 * définir un mot de passe initial sans notification trompeuse.
 *
 * Sécurité : cette fonction exige un token d'accès utilisateur valide
 * (obtenu via verifyOtp côté client juste avant l'appel) et ne modifie
 * que le mot de passe du compte correspondant à ce token — jamais un
 * autre compte, même avec la clé service_role.
 *
 * Variables d'environnement requises (Dashboard → Edge Functions → Secrets,
 * généralement déjà présentes par défaut sur tout projet Supabase) :
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

// @ts-nocheck  (environnement Deno — types résolus au déploiement Supabase)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Configuration serveur incomplète." }, 500);
  }

  let password: string;
  try {
    const bodyJson = await req.json();
    password = bodyJson?.password;
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return json({ error: "Mot de passe invalide (6 caractères minimum)." }, 400);
  }

  // Le token de l'appelant identifie SANS AMBIGUÏTÉ quel compte est
  // concerné : on ne fait jamais confiance à un user_id envoyé dans le
  // corps de la requête, on le déduit uniquement du token d'accès fourni.
  const authHeader = req.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return json({ error: "Authentification requise." }, 401);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: getUserError } =
    await supabaseAdmin.auth.getUser(accessToken);
  if (getUserError || !userData?.user) {
    return json({ error: "Session invalide ou expirée." }, 401);
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userData.user.id,
    { password },
  );
  if (updateError) {
    return json({ error: updateError.message }, 400);
  }

  return json({ success: true });
});
