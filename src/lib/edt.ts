/** Emploi du temps : format « papier » — jours × blocs (matin / après-midi). */

export type Bloc = "matin" | "apres_midi";

export const BLOCS: { key: Bloc; label: string; defaultDebut: string; defaultFin: string }[] = [
  { key: "matin", label: "Matin", defaultDebut: "07:30", defaultFin: "09:30" },
  { key: "apres_midi", label: "Après-midi", defaultDebut: "14:00", defaultFin: "16:00" },
];

/** Jours travaillés : Lundi (1) → Samedi (6). */
export const JOURS = [1, 2, 3, 4, 5, 6];
export const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const JOURS_LONGS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export type Cours = {
  id: string;
  niveau_id: string;
  jour_semaine: number;
  bloc: Bloc;
  heure_debut: string;
  heure_fin: string;
  matiere: string;
  professeur: string | null;
  salle: string | null;
};

export function hhmm(t: string): string {
  return t.slice(0, 5);
}

export function toMinutes(t: string): number {
  const [h, m] = hhmm(t).split(":").map(Number);
  return h * 60 + m;
}

/** Cours d'un jour + bloc, triés par heure de début. */
export function coursOf(list: Cours[], jour: number, bloc: Bloc): Cours[] {
  return list
    .filter((c) => c.jour_semaine === jour && c.bloc === bloc)
    .sort((a, b) => toMinutes(a.heure_debut) - toMinutes(b.heure_debut));
}
