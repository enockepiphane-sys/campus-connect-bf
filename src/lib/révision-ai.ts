import { supabase } from "@/integrations/supabase/client";

// Envoie le cours (PDF) et l'outil choisi à la fonction Supabase « campuslink-ai » (Gemini).
export type RevisionAiInput = {
  tool: "resume" | "assistant" | "qcm" | "fiches" | "exercices";
  question: string;
  file: File | null;
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Lecture du PDF impossible."));
    reader.readAsDataURL(file);
  });
}

export async function runRevisionAi({ tool, question, file }: RevisionAiInput): Promise<string> {
  const pdfBase64 = file ? await toBase64(file) : undefined;
  const { data, error } = await supabase.functions.invoke("campuslink-ai", {
    body: { tool, question, pdfBase64, mimeType: file ? "application/pdf" : undefined },
  });
  if (error) {
    let message = "Le service IA est indisponible. Réessaie plus tard.";
    try {
      const response = (error as { context?: Response }).context;
      if (response) {
        const body = await response.json();
        if (typeof body?.error === "string") message = body.error;
      }
    } catch {
      /* message par défaut */
    }
    throw new Error(message);
  }
  if (typeof data?.error === "string") throw new Error(data.error);
  if (typeof data?.result !== "string" || !data.result) throw new Error("L’IA n’a pas produit de réponse. Réessaie.");
  return data.result;
}
