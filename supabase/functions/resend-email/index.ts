/**
 * Edge Function `resend-email`
 *
 * Envoie un email transactionnel via l'API Resend en utilisant une adresse
 * d'expéditeur appartenant EXACTEMENT au domaine vérifié sur Resend
 * (`campuslink-bf.app`). C'est indispensable pour l'alignement SPF/DKIM/DMARC :
 * si le `from` ne correspond pas au domaine vérifié, Gmail peut accepter en
 * "best effort" mais Yahoo / Outlook / iCloud rejettent ou classent en spam.
 *
 * Variables d'environnement (Dashboard → Edge Functions → Secrets) :
 *   - RESEND_API_KEY   : clé API Resend (obligatoire)
 *   - RESEND_FROM      : (optionnel) surcharge du "from", ex:
 *                        "CampusLink <team@campuslink-bf.app>"
 *
 * Le "from" par défaut est construit à partir du domaine vérifié et respecte
 * la syntaxe RFC 5322 : `Nom affiché <adresse@domaine>`.
 */

// @ts-nocheck  (environnement Deno — types résolus au déploiement Supabase)

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Domaine vérifié sur Resend + adresse d'envoi correspondante.
const VERIFIED_DOMAIN = "campuslink-bf.app";
const DEFAULT_FROM = `CampusLink <team@${VERIFIED_DOMAIN}>`;

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

/**
 * Valide que l'adresse "from" contient bien une adresse du domaine vérifié.
 * Accepte les deux formats : `adresse@domaine` ou `Nom <adresse@domaine>`.
 */
function isFromOnVerifiedDomain(from: string): boolean {
  const match = from.match(/<([^>]+)>/);
  const address = (match ? match[1] : from).trim().toLowerCase();
  return address.endsWith(`@${VERIFIED_DOMAIN}`);
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée. Utilisez POST." }, 405);
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("[resend-email] RESEND_API_KEY manquant.");
    return json({ error: "Configuration serveur incomplète." }, 500);
  }

  let payload: {
    to?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    from?: string;
    replyTo?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Corps de requête JSON invalide." }, 400);
  }

  const { to, subject, html, text, replyTo } = payload;
  if (!to || !subject || (!html && !text)) {
    return json(
      { error: "Champs requis manquants : 'to', 'subject' et 'html' ou 'text'." },
      400,
    );
  }

  // "from" : priorité au secret RESEND_FROM, sinon adresse par défaut du domaine.
  const from = (Deno.env.get("RESEND_FROM") || DEFAULT_FROM).trim();
  console.info("[resend-email] request received", {
    requestId,
    method: req.method,
    toCount: Array.isArray(to) ? to.length : 1,
    subject,
    from,
  });

  if (!isFromOnVerifiedDomain(from)) {
    console.error(
      `[resend-email] [${requestId}] "from" (${from}) hors du domaine vérifié ${VERIFIED_DOMAIN}.`,
    );
    return json(
      {
        error: `L'adresse d'expéditeur doit appartenir au domaine vérifié ${VERIFIED_DOMAIN}.`,
      },
      500,
    );
  }

  const body: Record<string, unknown> = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
  };
  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;

  try {
    console.info("[resend-email] calling Resend API", {
      requestId,
      endpoint: RESEND_ENDPOINT,
      from,
    });
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[resend-email] Resend API error", {
        requestId,
        status: res.status,
        data,
      });
      return json({ error: "Échec de l'envoi de l'email.", details: data }, 502);
    }

    console.info("[resend-email] email sent", {
      requestId,
      resendId: data?.id ?? null,
    });
    return json({ ok: true, id: data?.id ?? null });
  } catch (err) {
    console.error("[resend-email] Exception:", { requestId, err });
    return json({ error: "Erreur réseau lors de l'appel à Resend." }, 502);
  }
});
