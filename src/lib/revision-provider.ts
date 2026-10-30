import { supabase } from "@/integrations/supabase/client";

export const REVISION_TOOLS = [
  { id: "resume", label: "Résumé PDF", description: "Résumé structuré du cours" },
  { id: "assistant", label: "Assistant de cours", description: "Questions et explications" },
  { id: "qcm", label: "Générateur de QCM", description: "Questions à choix multiples" },
  { id: "fiches", label: "Fiches de révision", description: "Définitions, formules et notions" },
  { id: "exercices", label: "Sujets d’entraînement", description: "Exercices et corrigés" },
] as const;

export type RevisionTool = typeof REVISION_TOOLS[number]["id"];
export type RevisionRequest = { tool: RevisionTool; pdf: Uint8Array; question?: string };
export type RevisionResult = {
  titre: string;
  sections: { titre: string; contenu: string }[];
  questions?: { enonce: string; choix: string[]; bonneReponse: number; explication: string }[];
};
export interface RevisionProvider {
  generate(input: RevisionRequest, signal?: AbortSignal): Promise<RevisionResult>;
}
export const REVISION_API_CONNECTED = true;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function validatePdf(file: { size: number; name: string; type: string }): string | null {
  if (file.size === 0) return "Ce fichier est vide.";
  if (file.size > MAX_PDF_BYTES) return "Le PDF doit peser au maximum 10 Mo.";
  if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
    return "Sélectionnez un document PDF.";
  }
  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export const revisionProvider: RevisionProvider = {
  async generate(input, signal) {
    const pdfBase64 = bytesToBase64(input.pdf);
    const { data, error } = await supabase.functions.invoke("campuslink-ai", {
      body: {
        tool: input.tool,
        question: input.question ?? "",
        pdfBase64,
        mimeType: "application/pdf",
      },
      signal,
    });

    if (error) {
      const details = data?.error || error.message;
      throw new Error(details || "Impossible de contacter le service IA.");
    }
    if (data?.error) throw new Error(data.error);
    if (!data?.result || typeof data.result.titre !== "string" || !Array.isArray(data.result.sections)) {
      throw new Error("La réponse de l'IA est incomplète. Réessayez.");
    }
    return data.result as RevisionResult;
  },
};
