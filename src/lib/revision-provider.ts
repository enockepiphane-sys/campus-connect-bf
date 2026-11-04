
import { supabase } from "@/integrations/supabase/client";

export const REVISION_TOOLS = [
  { id: "resume", label: "Résumé PDF", description: "Résumé structuré du cours" },
  { id: "assistant", label: "Assistant de cours", description: "Questions et explications" },
  { id: "qcm", label: "Générateur de QCM", description: "Questions à choix multiples" },
  { id: "fiches", label: "Fiches de révision", description: "Définitions, formules et notions" },
  { id: "exercices", label: "Sujets d’entraînement", description: "Exercices et corrigés" },
] as const;

export type RevisionTool = typeof REVISION_TOOLS[number]["id"];

export type RevisionRequest = {
  tool: RevisionTool;
  pdf: Uint8Array;
  question?: string;
};

export type RevisionResult = {
  titre: string;
  sections: {
    titre: string;
    contenu: string;
  }[];
  questions?: {
    enonce: string;
    choix: string[];
    bonneReponse: number;
    explication: string;
  }[];
};

export interface RevisionProvider {
  generate(input: RevisionRequest, signal?: AbortSignal): Promise<RevisionResult>;
}

export const REVISION_API_CONNECTED = true;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function validatePdf(file: {
  size: number;
  name: string;
  type: string;
}): string | null {
  if (file.size === 0) return "Ce fichier est vide.";

  if (file.size > MAX_PDF_BYTES) {
    return "Le PDF doit peser au maximum 10 Mo.";
  }

  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  ) {
    return "Sélectionnez un document PDF.";
  }

  return null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize),
    );
  }

  return btoa(binary);
}

async function extractErrorDetails(error: unknown): Promise<string> {
  const details = error as {
    name?: string;
    message?: string;
    context?: unknown;
  };

  console.error("CampusLink AI - erreur Supabase :", error);

  if (details?.context instanceof Response) {
    try {
      const responseText = await details.context.clone().text();

      console.error("Réponse Edge Function :", {
        status: details.context.status,
        statusText: details.context.statusText,
        body: responseText,
      });

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          return parsed.error || parsed.message || responseText;
        } catch {
          return responseText;
        }
      }

      return `Erreur HTTP ${details.context.status}: ${details.context.statusText}`;
    } catch {
      return "Impossible de lire la réponse du serveur Supabase.";
    }
  }

  if (details?.context instanceof Error) {
    console.error("Détail réseau :", details.context);
    return `${details.context.name}: ${details.context.message}`;
  }

  if (details?.message) {
    return `${details.name || "Erreur"}: ${details.message}`;
  }

  return "Impossible de communiquer avec la fonction Supabase.";
}

function validateResult(result: unknown): RevisionResult {
  if (!result || typeof result !== "object") {
    throw new Error("La réponse reçue du serveur est vide ou invalide.");
  }

  const value = result as Record<string, unknown>;

  if (
    typeof value.titre !== "string" ||
    !Array.isArray(value.sections)
  ) {
    throw new Error(
      "La réponse d'IA CampusLink ne respecte pas le format attendu.",
    );
  }

  const validSections = value.sections.every((section) => {
    return (
      section !== null &&
      typeof section === "object" &&
      typeof section.titre === "string" &&
      typeof section.contenu === "string"
    );
  });

  if (!validSections) {
    throw new Error("Les sections reçues d'IA CampusLink sont incomplètes.");
  }

  if (value.questions !== undefined && !Array.isArray(value.questions)) {
    throw new Error("Le format des questions générées est invalide.");
  }

  return value as unknown as RevisionResult;
}

export const revisionProvider: RevisionProvider = {
  async generate(input, signal) {
    if (!input.pdf || input.pdf.length === 0) {
      throw new Error("Aucun document PDF n'a été fourni.");
    }

    if (input.pdf.length > MAX_PDF_BYTES) {
      throw new Error("Le PDF dépasse la limite de 10 Mo.");
    }

    if (input.tool === "assistant" && !input.question?.trim()) {
      throw new Error("Écris ta question sur le cours.");
    }

    const pdfBase64 = bytesToBase64(input.pdf);

    console.log("CampusLink AI : envoi de la demande", {
      tool: input.tool,
      pdfSize: input.pdf.length,
      questionLength: input.question?.length ?? 0,
    });

    let data: any;
    let error: any;

    try {
      const response = await supabase.functions.invoke("campuslink-ai", {
        body: {
          tool: input.tool,
          question: input.question?.trim() ?? "",
          pdfBase64,
          mimeType: "application/pdf",
        },
        signal,
      });

      data = response.data;
      error = response.error;
    } catch (unexpectedError) {
      const message = await extractErrorDetails(unexpectedError);
      throw new Error(`Échec de communication avec Supabase : ${message}`);
    }

    if (error) {
      const message = await extractErrorDetails(error);

      throw new Error(
        `La fonction CampusLink AI n'a pas répondu correctement : ${message}`,
      );
    }

    if (!data) {
      throw new Error(
        "Supabase n'a retourné aucune donnée. Vérifie les journaux de la fonction campuslink-ai.",
      );
    }

    if (data.error) {
      throw new Error(`Erreur de traitement d'IA CampusLink : ${data.error}`);
    }

    if (data.success !== true) {
      throw new Error(
        "La fonction Supabase a répondu, mais n'a pas confirmé la génération.",
      );
    }

    return validateResult(data.result);
  },
};
