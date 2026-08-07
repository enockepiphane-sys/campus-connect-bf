/** Barème d'appréciation automatique d'une note sur 20. */
export function appreciation(valeur: number): string {
  const v = Number(valeur);
  if (Number.isNaN(v)) return "";
  if (v < 6) return "Très insuffisant";
  if (v < 10) return "Insuffisant";
  if (v < 12) return "Passable";
  if (v < 14) return "Assez bien";
  if (v < 16) return "Bien";
  if (v < 18) return "Très bien";
  return "Excellent";
}
