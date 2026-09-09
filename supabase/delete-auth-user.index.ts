// Edge Function : delete-auth-user
//
// Supprime définitivement un compte Supabase Auth (auth.users) à partir
// de son email. Nécessaire car la "suppression définitive" côté admin
// (corbeille) ne supprimait jusqu'ici que la fiche métier
// (etudiants_pre_inscrits / admins_pre_autorises), en laissant le compte
// auth.users intact. Résultat : l'email restait "déjà utilisé" pour
// toujours, même après suppression complète côté admin.
//
// Sécurité : verify_jwt reste activé (contrairement à resend-email) car
// cet appel doit être réservé aux admins/super-admins authentifiés.
// On vérifie le rôle de l'appelant via is_super_admin / is_admin_of_etablissement
// (mêmes fonctions RPC que le reste de la plateforme) avant d'utiliser la
// clé service_role pour la suppression réelle.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentification requise." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client "appelant" : sert uniquement à identifier qui fait la demande
    // et à vérifier son rôle via les RPC existants (RLS-safe).
    const supabaseCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseCaller.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Session invalide." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

    const { email, etablissementId } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Paramètre 'email' manquant." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérification du rôle : super_admin (tous établissements) ou
    // admin de l'établissement concerné (etablissementId requis dans ce cas).
    const { data: isSuperAdmin } = await supabaseCaller.rpc("is_super_admin", {
      _user_id: callerId,
    });

    let autorise = Boolean(isSuperAdmin);

    if (!autorise) {
      if (!etablissementId) {
        return new Response(
          JSON.stringify({ error: "etablissementId requis pour un admin d'établissement." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: isAdmin } = await supabaseCaller.rpc("is_admin_of_etablissement", {
        _user_id: callerId,
        _etab_id: etablissementId,
      });
      autorise = Boolean(isAdmin);
    }

    if (!autorise) {
      return new Response(JSON.stringify({ error: "Action réservée aux administrateurs." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client "admin" : seule cette instance, avec la clé service_role,
    // peut lister/supprimer des comptes auth.users.
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // auth.admin ne propose pas de recherche directe par email : on liste
    // et on filtre. Le nombre de comptes reste raisonnable pour ce type de
    // plateforme ; si le volume grandit beaucoup, prévoir la pagination.
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const compteCible = listData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!compteCible) {
      // Rien à supprimer côté auth : ce n'est pas une erreur, l'objectif
      // (email libéré) est déjà atteint.
      return new Response(JSON.stringify({ success: true, deleted: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(compteCible.id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, deleted: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
