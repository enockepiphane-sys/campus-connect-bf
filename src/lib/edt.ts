/** Créneaux horaires de la grille hebdomadaire (07:30 → 18:00, par 30 min). */
export const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let m = 7 * 60 + 30; m < 18 * 60; m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
})();

export const SLOT_MINUTES = 30;

export const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const JOURS_LONGS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function addMinutes(hhmm: string, delta: number): string {
  const t = toMinutes(hhmm) + delta;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export type Creneau = {
  id: string;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  matiere: string;
  salle: string | null;
  enseignant: string | null;
};

/** Créneau couvrant ce jour/heure de départ, s'il existe. */
export function creneauAt(list: Creneau[], jour: number, slot: string): Creneau | undefined {
  return list.find((c) => c.jour_semaine === jour && c.heure_debut.slice(0, 5) === slot);
}

/** Créneau occupant (mais ne commençant pas à) ce jour/heure. */
export function isCovered(list: Creneau[], jour: number, slot: string): boolean {
  const t = toMinutes(slot);
  return list.some(
    (c) =>
      c.jour_semaine === jour &&
      toMinutes(c.heure_debut) < t &&
      toMinutes(c.heure_fin) > t,
  );
}

/** Nombre de lignes couvertes par un créneau. */
export function spanOf(c: Creneau): number {
  return Math.max(1, Math.round((toMinutes(c.heure_fin) - toMinutes(c.heure_debut)) / SLOT_MINUTES));
}
