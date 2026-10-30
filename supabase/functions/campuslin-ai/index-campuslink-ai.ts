const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const toolInstructions: Record<string, string> = {
  resume: "Produis un résumé structuré, fidèle au PDF, avec les notions essentielles et les définitions.",
  assistant: "Réponds à la question de l'étudiant en t'appuyant prioritairement sur le PDF. Explique pédagogiquement.",
  qcm: "Crée 10 QCM basés sur le PDF. Chaque question doit avoir 4 choix, un index de bonne réponse commençant à 0 et une explication.",
  fiches: "Crée des fiches de révision synthétiques avec définitions, formules, dates et notions clés.",
  exercices: "Crée 5 exercices progressifs basés sur le PDF avec leurs corrigés détaillés.",
};

Deno.serve(async (req: Request) => {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!apiKey || !supabaseUrl || !supabaseKey) return json({ error: "Configuration serveur incomplète" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Connexion requise" }, 401);
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: authHeader },
    });
    if (!authResponse.ok) return json({ error: "Session invalide. Reconnectez-vous à CampusLink." }, 401);

    const body = await req.json();
    const { tool, question = "", pdfBase64, mimeType = "application/pdf" } = body;
    if (!Object.hasOwn(toolInstructions, tool)) return json({ error: "Outil de révision invalide." }, 400);
    if (typeof pdfBase64 !== "string" || !pdfBase64.length) return json({ error: "Veuillez joindre un PDF." }, 400);
    if (pdfBase64.length > 14_000_000) return json({ error: "PDF trop volumineux. Limite : 10 Mo." }, 413);
    if (mimeType !== "application/pdf") return json({ error: "Format de fichier non accepté." }, 400);
    if (typeof question !== "string" || question.length > 4000) return json({ error: "Question trop longue." }, 400);

    const prompt = `${toolInstructions[tool]}\n\n${tool === "assistant" ? `Question de l'étudiant : ${question}` : ""}\n\nRéponds UNIQUEMENT en JSON valide avec cette structure exacte : {"titre":"...","sections":[{"titre":"...","contenu":"..."}],"questions":[{"enonce":"...","choix":["...","...","...","..."],"bonneReponse":0,"explication":"..."}]}. Pour les outils autres que QCM, tu peux omettre questions. Le contenu doit être en français, clair et adapté à un étudiant. N'invente pas de contenu absent du document.`;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Tu es CampusLink AI, assistant pédagogique universitaire." }] },
          contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: "application/pdf", data: pdfBase64 } }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 8192, responseMimeType: "application/json" },
        }),
      },
    );
    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error("Gemini error:", geminiData);
      return json({ error: geminiData.error?.message || "Erreur lors de la génération Gemini." }, 502);
    }
    const raw = geminiData.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
    if (!raw) return json({ error: "Gemini n'a pas produit de réponse. Réessayez." }, 502);
    let result;
    try { result = JSON.parse(raw); } catch { return json({ error: "La réponse de Gemini est illisible. Réessayez." }, 502); }
    if (typeof result.titre !== "string" || !Array.isArray(result.sections)) {
      return json({ error: "La réponse de Gemini ne respecte pas le format attendu." }, 502);
    }
    return json({ success: true, result });
  } catch (error) {
    console.error("campuslink-ai:", error);
    return json({ error: "Erreur interne du service IA." }, 500);
  }
});
