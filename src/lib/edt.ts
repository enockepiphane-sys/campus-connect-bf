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

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/**
 * Formate la semaine d'un emploi du temps à partir de la date du lundi
 * (stockée en base au format "YYYY-MM-DD"), ex. "Semaine du 20 au 26 oct. 2026".
 * Retourne null si aucune date n'est fournie.
 */
export function formatSemaineEdt(lundiISO: string | null | undefined): string | null {
  if (!lundiISO) return null;
  const lundi = new Date(`${lundiISO}T00:00:00`);
  if (Number.isNaN(lundi.getTime())) return null;
  const samedi = new Date(lundi);
  samedi.setDate(lundi.getDate() + 5);

  const jLundi = lundi.getDate();
  const jSamedi = samedi.getDate();
  const mLundi = MOIS_COURTS[lundi.getMonth()];
  const mSamedi = MOIS_COURTS[samedi.getMonth()];
  const anneeSamedi = samedi.getFullYear();

  if (lundi.getMonth() === samedi.getMonth()) {
    return `Semaine du ${jLundi} au ${jSamedi} ${mSamedi} ${anneeSamedi}`;
  }
  return `Semaine du ${jLundi} ${mLundi} au ${jSamedi} ${mSamedi} ${anneeSamedi}`;
}
