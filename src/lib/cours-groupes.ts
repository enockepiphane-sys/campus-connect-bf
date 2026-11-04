// Fonctions sans dépendance (testables) pour ranger les cours en ligne.

export const NIVEAUX = ["L1", "L2", "L3", "M1", "M2", "Doctorat", "BTS 1", "BTS 2", "Autre"] as const;
export type Niveau = (typeof NIVEAUX)[number];

type AvecFilieres = { filiere: string; filieres?: string[] | null };
type AvecNiveaux = { niveau: Niveau; niveaux?: Niveau[] | null };

/** Toutes les filières d'un cours (retombe sur l'ancienne colonne « filiere »), sans doublon. */
export const filieresOf = (c: AvecFilieres): string[] => [...new Set(c.filieres?.length ? c.filieres : [c.filiere])];

/** Tous les niveaux d'un cours (retombe sur l'ancienne colonne « niveau »), sans doublon, dans l'ordre L1, L2, L3… */
export const niveauxOf = (c: AvecNiveaux): Niveau[] =>
  [...new Set(c.niveaux?.length ? c.niveaux : [c.niveau])].sort((a, b) => NIVEAUX.indexOf(a) - NIVEAUX.indexOf(b));

/** Libellé affiché d'un cours : « Droit + Économie › L1 + L2 ». */
export const libelleCours = (c: AvecFilieres & AvecNiveaux) => `${filieresOf(c).join(" + ")} › ${niveauxOf(c).join(" + ")}`;

/**
 * Range les cours par « Filières › Niveaux ».
 * Un cours lié à plusieurs niveaux ou filières n'apparaît qu'UNE seule fois,
 * dans un groupe qui affiche tous ses niveaux (ex. « Droit › L1 + L2 »).
 */
export function grouperCours<T extends AvecFilieres & AvecNiveaux & { id: string }>(cours: T[]): [string, T[]][] {
  const map = new Map<string, { premier: T; list: T[] }>();
  const vus = new Set<string>();
  for (const c of cours) {
    if (vus.has(c.id)) continue;
    vus.add(c.id);
    const k = libelleCours(c);
    const g = map.get(k);
    if (g) g.list.push(c);
    else map.set(k, { premier: c, list: [c] });
  }
  return [...map.entries()]
    .sort(([, a], [, b]) => {
      const f = filieresOf(a.premier)[0].localeCompare(filieresOf(b.premier)[0], "fr");
      if (f) return f;
      const na = niveauxOf(a.premier), nb = niveauxOf(b.premier);
      return NIVEAUX.indexOf(na[0]) - NIVEAUX.indexOf(nb[0]) || na.length - nb.length;
    })
    .map(([k, g]) => [k, g.list]);
}
