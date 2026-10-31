// CampusLink — Révision & IA (Google Gemini). Accessible à tous les visiteurs.
// Secret requis dans Supabase : GEMINI_API_KEY. Secret facultatif : GEMINI_MODEL.

// Modèles essayés dans l'ordre (si un nom n'existe pas, on passe au suivant).
const MODELS = [Deno.env.get("GEMINI_MODEL"), "gemini-flash-lite-latest", "gemini-2.5-flash"].filter(
  (m, i, all): m is string => Boolean(m) && all.indexOf(m) === i,
);
const GEMINI_TIMEOUT_MS = 55_000;
const MAX_PDF_BASE64_LENGTH = 7_000_000; // ≈ 5 Mo
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const LIMIT_REQUESTS = 8; // par visiteur
const LIMIT_WINDOW_MS = 10 * 60 * 1000; // sur 10 minutes

const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < LIMIT_WINDOW_MS);
  if (recent.length >= LIMIT_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      req.headers.get("Access-Control-Request-Headers") ??
      "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers",
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const instructions: Record<string, string> = {
  resume:
    "Réalise un résumé clair et structuré du document. Présente les notions essentielles, les définitions, les explications et les points à retenir.",
  assistant:
    "Agis comme un professeur pédagogue. Réponds à la question de l'étudiant progressivement, avec des explications détaillées et des exemples simples.",
  qcm:
    "Crée un QCM de révision adapté au contenu fourni. Propose plusieurs questions, quatre choix par question, les bonnes réponses et leurs explications.",
  fiches:
    "Crée des fiches de révision synthétiques et bien organisées avec titres, définitions, formules, exemples et éléments essentiels à mémoriser.",
  exercices:
    "Crée des exercices adaptés au niveau de l'étudiant à partir du contenu fourni. Donne les énoncés, puis les corrections détaillées étape par étape.",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Méthode non autorisée." }, 405);

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return json(req, { error: "L'IA n'est pas configurée : le secret GEMINI_API_KEY est manquant dans Supabase." }, 500);
    }

    const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "inconnu").split(",")[0].trim();
    if (tooMany(ip)) {
      return json(req, { error: "Tu as fait beaucoup de demandes. Patiente quelques minutes avant de réessayer." }, 429);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(req, { error: "Requête invalide." }, 400);
    }
    const { tool, question, pdfBase64, mimeType } = body as {
      tool?: unknown; question?: unknown; pdfBase64?: unknown; mimeType?: unknown;
    };

    if (typeof tool !== "string" || !(tool in instructions)) {
      return json(req, { error: "Outil de révision inconnu." }, 400);
    }
    const q = typeof question === "string" ? question.trim().slice(0, 4000) : "";
    if (tool === "assistant" && !q) return json(req, { error: "Écris ta question sur le cours." }, 400);
    if (tool !== "assistant" && !pdfBase64) return json(req, { error: "Importe d'abord un cours (PDF ou photo)." }, 400);

    if (pdfBase64 !== undefined && pdfBase64 !== null) {
      if (typeof pdfBase64 !== "string" || pdfBase64.length > MAX_PDF_BASE64_LENGTH) {
        return json(req, { error: "PDF trop volumineux. Utilise un fichier de 5 Mo maximum." }, 413);
      }
      if (mimeType && !ALLOWED_MIME.includes(String(mimeType))) {
        return json(req, { error: "Formats acceptés : PDF, JPG, PNG ou WebP." }, 400);
      }
    }

    const prompt = `${instructions[tool]}

${q ? `Consigne de l'étudiant :\n${q}` : "Aucune consigne supplémentaire. Réalise directement le travail demandé à partir du document fourni."}

Réponds en français, avec une présentation claire, structurée et adaptée à un étudiant.
Format obligatoire : Markdown simple.
- Commence par un seul titre de niveau 1 (# Titre).
- Découpe en sections avec des titres de niveau 2 (## Section), puis des sous-titres de niveau 3 (### Sous-section) si utile.
- Utilise des listes à puces (- ), des listes numérotées (1. ), et du **gras** pour les mots-clés et définitions importantes.
- Si c'est pertinent, utilise des tableaux Markdown.
- Termine par une section « ## Points clés à retenir ».
- N'utilise JAMAIS de LaTeX ni de signes dollar : écris les formules en texte simple avec des symboles (×, ÷, ², V₀, ≥).
- Si le document est manuscrit ou une photo, lis-le attentivement ; si un passage est illisible, signale-le au lieu de l'inventer.
- Ne renvoie pas de JSON et n'entoure pas la réponse de balises de code.`;

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (typeof pdfBase64 === "string" && pdfBase64) {
      parts.push({ inline_data: { mime_type: typeof mimeType === "string" && ALLOWED_MIME.includes(mimeType) ? mimeType : "application/pdf", data: pdfBase64 } });
    }
    const requestBody = JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.4 },
    });

    // deno-lint-ignore no-explicit-any
    let data: any = null;
    let lastMessage = "";
    for (const model of MODELS) {
      let res: Response;
      try {
        res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
            body: requestBody,
          },
          GEMINI_TIMEOUT_MS,
        );
      } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        return json(req, {
          error: timedOut
            ? "Google Gemini n'a pas répondu à temps. Réessaie avec un document plus court."
            : "Impossible de contacter Google Gemini. Réessaie plus tard.",
        }, 504);
      }

      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = { error: { message: text } }; }

      if (res.ok) { lastMessage = ""; break; }

      lastMessage = data?.error?.message ?? "Erreur Gemini";
      console.error("Gemini en erreur", { model, status: res.status, message: lastMessage });

      if (res.status === 404 || res.status === 400 && /model/i.test(lastMessage)) continue; // nom de modèle invalide : on essaie le suivant
      if (res.status === 429) return json(req, { error: "Le quota gratuit de l'IA est atteint pour le moment. Réessaie dans quelques minutes." }, 429);
      if (res.status === 401 || res.status === 403) return json(req, { error: "La clé Gemini est refusée. Vérifie le secret GEMINI_API_KEY dans Supabase." }, 502);
      return json(req, { error: "Le service IA est momentanément indisponible. Réessaie." }, 502);
    }

    if (lastMessage) {
      return json(req, { error: "Aucun modèle Gemini disponible avec ta clé. Définis le secret GEMINI_MODEL avec un nom valide (voir Google AI Studio)." }, 502);
    }

    const generated = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    if (!generated) return json(req, { error: "L'IA n'a pas produit de réponse. Réessaie." }, 502);

    // Sécurité : si le modèle renvoie quand même du JSON {"result": ...}, on le déballe.
    let result = generated.replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "").trim();
    if (/^\{\s*"result"\s*:/.test(result)) {
      try {
        const parsed = JSON.parse(result);
        if (typeof parsed?.result === "string") result = parsed.result;
      } catch { /* l'affichage de l'application s'en charge */ }
    }

    return json(req, { success: true, result });
  } catch (error) {
    console.error("campuslink-ai : erreur générale", error);
    return json(req, { error: "Une erreur est survenue pendant le traitement. Réessaie." }, 500);
  }
});
