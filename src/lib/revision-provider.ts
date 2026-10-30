// Contrat d'intégration future. Aucun fournisseur, clé ou faux résultat n'est livré.
// Un adaptateur réel devra être appelé UNIQUEMENT dans un handler serveur
// authentifié et limiter taille, fréquence et coût par utilisateur.
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
export interface RevisionProvider { generate(input: RevisionRequest, signal?: AbortSignal): Promise<RevisionResult> }
export const REVISION_API_CONNECTED = false;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export function validatePdf(file: { size: number; name: string; type: string }): string | null {
  if (file.size === 0) return "Ce fichier est vide.";
  if (file.size > MAX_PDF_BYTES) return "Le PDF doit peser au maximum 10 Mo.";
  if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) return "Sélectionnez un document PDF.";
  return null;
}
