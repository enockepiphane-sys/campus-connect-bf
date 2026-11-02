export const CATEGORIES = ["Stages", "Offres d'emploi", "Bourses d'études", "Concours", "Formations", "Appels à candidatures"] as const;
export type Categorie = typeof CATEGORIES[number];
export type Opportunite = {
  id: string; titre: string; organisme: string; description: string; conditions: string;
  categorie: Categorie; date_limite: string; candidature: string; publie: boolean;
  created_by: string; created_at: string; updated_at: string;
};
export type OffreInput = Pick<Opportunite, "titre" | "organisme" | "description" | "conditions" | "categorie" | "date_limite" | "candidature" | "publie">;
export function deadlineState(deadline: string, now = new Date()): "expired" | "soon" | "open" {
  // La date limite inclut la journée entière au Burkina Faso (UTC).
  const end = Date.parse(`${deadline}T23:59:59.999Z`);
  if (!Number.isFinite(end) || end < now.getTime()) return "expired";
  return end - now.getTime() <= 7 * 86400000 ? "soon" : "open";
}
export function candidatureHref(value: string): string | null {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; } catch { return null; }
}
export function safeSharedDestination(value: unknown): "/opportunites" | "/revision-ia" | "/gestion-opportunites" | "/marche" {
  return value === "/revision-ia" || value === "/gestion-opportunites" || value === "/marche" ? value : "/opportunites";
}
export function validateOffre(input: OffreInput): string | null {
  if (![input.titre, input.organisme, input.description, input.conditions, input.candidature].every(v => v.trim())) return "Complétez tous les champs obligatoires.";
  if (!CATEGORIES.includes(input.categorie)) return "Catégorie invalide.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_limite) || !Number.isFinite(Date.parse(input.date_limite + "T00:00:00Z")) || new Date(input.date_limite + "T00:00:00Z").toISOString().slice(0, 10) !== input.date_limite) return "Date limite invalide.";
  if (input.titre.length > 200 || input.organisme.length > 200 || input.description.length > 20000 || input.conditions.length > 10000 || input.candidature.length > 2000) return "Un champ dépasse la longueur autorisée.";
  return null;
}
