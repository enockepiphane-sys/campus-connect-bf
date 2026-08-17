import * as XLSX from "xlsx";

export type ChampsOptionnels = {
  matricule: boolean;
  telephone: boolean;
};

export type LigneEtudiantImport = {
  nom_complet: string;
  email: string;
  date_naissance: string; // toujours normalisée en YYYY-MM-DD
  matricule?: string;
  telephone?: string;
};

export type LigneRejetee = {
  ligne: number;
  raison: string;
  donnees: Record<string, unknown>;
};

export type ResultatParsingExcel = {
  valides: LigneEtudiantImport[];
  rejetees: LigneRejetee[];
};

/**
 * Alias de colonnes reconnus, en minuscules et sans accents.
 * Permet d'accepter différents intitulés selon l'établissement.
 */
const ALIAS_NOM_COMPLET = ["nom_complet", "nom complet", "nomcomplet", "nom et prenom", "nom et prénom"];
const ALIAS_NOM = ["nom", "nom de famille", "last name", "lastname"];
const ALIAS_PRENOM = ["prenom", "prénom", "prenoms", "prénoms", "first name", "firstname"];
const ALIAS_EMAIL = ["email", "e-mail", "mail", "adresse mail", "adresse email"];
const ALIAS_DATE_NAISSANCE = [
  "date_naissance", "date de naissance", "naissance", "date naissance", "birthdate", "date of birth", "dob",
];
const ALIAS_MATRICULE = ["matricule", "matricule etudiant", "matricule étudiant", "numero matricule", "numéro matricule", "id etudiant", "id étudiant"];
const ALIAS_TELEPHONE = ["telephone", "téléphone", "tel", "tél", "phone", "numero de telephone", "numéro de téléphone", "contact"];

function normaliserEnTete(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // retire les accents
}

function trouverColonne(
  headersNormalises: Map<string, string>,
  alias: string[],
): string | null {
  for (const a of alias) {
    const aNorm = normaliserEnTete(a);
    if (headersNormalises.has(aNorm)) return headersNormalises.get(aNorm)!;
  }
  return null;
}

/**
 * Détecte le format d'une date et la convertit en YYYY-MM-DD.
 * Gère : JJ/MM/AAAA, AAAA-MM-JJ, MM/JJ/AAAA (ambigu, traité en dernier recours),
 * dates Excel numériques (nombre de jours depuis 1900), et texte avec / . ou -.
 */
export function normaliserDateNaissance(valeur: unknown): string | null {
  if (valeur === null || valeur === undefined || valeur === "") return null;

  // Cas 1 : date Excel numérique (Excel stocke les dates comme un nombre de jours depuis 1899-12-30)
  if (typeof valeur === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + valeur * 86400000);
    if (!isNaN(date.getTime())) {
      return formatYMD(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }
    return null;
  }

  // Cas 2 : objet Date natif (SheetJS peut en produire selon les options)
  if (valeur instanceof Date) {
    return formatYMD(valeur.getFullYear(), valeur.getMonth() + 1, valeur.getDate());
  }

  const texte = String(valeur).trim();
  if (!texte) return null;

  // Cas 3 : déjà au format YYYY-MM-DD ou YYYY/MM/DD
  let m = texte.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return validerEtFormater(Number(y), Number(mo), Number(d));
  }

  // Cas 4 : JJ/MM/AAAA ou JJ-MM-AAAA ou JJ.MM.AAAA
  m = texte.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const [, a, b, y] = m;
    const numA = Number(a);
    const numB = Number(b);
    // Si le premier nombre est > 12, c'est forcément un jour (format JJ/MM/AAAA)
    if (numA > 12) {
      return validerEtFormater(Number(y), numB, numA);
    }
    // Si le deuxième nombre est > 12, c'est forcément un jour → format MM/JJ/AAAA
    if (numB > 12) {
      return validerEtFormater(Number(y), numA, numB);
    }
    // Ambigu (les deux ≤ 12) : on privilégie JJ/MM/AAAA, le format le plus courant
    // dans les listes administratives des établissements au Burkina Faso.
    return validerEtFormater(Number(y), numB, numA);
  }

  return null;
}

function validerEtFormater(annee: number, mois: number, jour: number): string | null {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  if (annee < 1900 || annee > new Date().getFullYear()) return null;
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  if (date.getUTCFullYear() !== annee || date.getUTCMonth() !== mois - 1 || date.getUTCDate() !== jour) {
    return null; // ex: 31 février -> invalide
  }
  return formatYMD(annee, mois, jour);
}

function formatYMD(annee: number, mois: number, jour: number): string {
  return `${String(annee).padStart(4, "0")}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

/**
 * Parse un fichier Excel (.xlsx/.xls) d'étudiants pré-inscrits.
 * - Combine nom + prénom si nom_complet n'est pas présent.
 * - Normalise la date de naissance quel que soit son format d'origine.
 * - N'inclut matricule/telephone que si demandés dans champsOptionnels.
 */
export async function parseExcelEtudiants(
  file: File,
  champsOptionnels: ChampsOptionnels,
): Promise<ResultatParsingExcel> {
  const buffer = await file.arrayBuffer();
  const classeur = XLSX.read(buffer, { type: "array", cellDates: false });
  const feuille = classeur.Sheets[classeur.SheetNames[0]];
  if (!feuille) return { valides: [], rejetees: [] };

  const lignesBrutes: Record<string, unknown>[] = XLSX.utils.sheet_to_json(feuille, {
    defval: "",
    raw: true,
  });

  if (lignesBrutes.length === 0) return { valides: [], rejetees: [] };

  // Construit une table de correspondance en-tête normalisé -> en-tête original
  const entetesOriginaux = Object.keys(lignesBrutes[0]);
  const headersNormalises = new Map<string, string>();
  for (const h of entetesOriginaux) {
    headersNormalises.set(normaliserEnTete(h), h);
  }

  const colNomComplet = trouverColonne(headersNormalises, ALIAS_NOM_COMPLET);
  const colNom = trouverColonne(headersNormalises, ALIAS_NOM);
  const colPrenom = trouverColonne(headersNormalises, ALIAS_PRENOM);
  const colEmail = trouverColonne(headersNormalises, ALIAS_EMAIL);
  const colDateNaissance = trouverColonne(headersNormalises, ALIAS_DATE_NAISSANCE);
  const colMatricule = champsOptionnels.matricule ? trouverColonne(headersNormalises, ALIAS_MATRICULE) : null;
  const colTelephone = champsOptionnels.telephone ? trouverColonne(headersNormalises, ALIAS_TELEPHONE) : null;

  const valides: LigneEtudiantImport[] = [];
  const rejetees: LigneRejetee[] = [];

  lignesBrutes.forEach((ligne, idx) => {
    const numeroLigne = idx + 2; // +2 car ligne 1 = en-têtes, index 0-based

    // Construction du nom complet : priorité à la colonne dédiée, sinon fusion nom + prénom
    let nomComplet = "";
    if (colNomComplet) {
      nomComplet = String(ligne[colNomComplet] ?? "").trim();
    } else if (colNom || colPrenom) {
      const nom = colNom ? String(ligne[colNom] ?? "").trim() : "";
      const prenom = colPrenom ? String(ligne[colPrenom] ?? "").trim() : "";
      nomComplet = [prenom, nom].filter(Boolean).join(" ").trim();
    }

    const email = colEmail ? String(ligne[colEmail] ?? "").trim().toLowerCase() : "";
    const dateBrute = colDateNaissance ? ligne[colDateNaissance] : null;
    const dateNaissance = normaliserDateNaissance(dateBrute);

    if (!nomComplet) {
      rejetees.push({ ligne: numeroLigne, raison: "Nom complet manquant", donnees: ligne });
      return;
    }
    if (!email || !email.includes("@")) {
      rejetees.push({ ligne: numeroLigne, raison: "Email manquant ou invalide", donnees: ligne });
      return;
    }
    if (!dateNaissance) {
      rejetees.push({
        ligne: numeroLigne,
        raison: `Date de naissance manquante ou format non reconnu (valeur reçue : "${dateBrute ?? ""}")`,
        donnees: ligne,
      });
      return;
    }

    const item: LigneEtudiantImport = {
      nom_complet: nomComplet,
      email,
      date_naissance: dateNaissance,
    };
    if (colMatricule) {
      const v = String(ligne[colMatricule] ?? "").trim();
      if (v) item.matricule = v;
    }
    if (colTelephone) {
      const v = String(ligne[colTelephone] ?? "").trim();
      if (v) item.telephone = v;
    }

    valides.push(item);
  });

  return { valides, rejetees };
}

// =========================================================
// Import Excel des notes
// =========================================================

export type LigneNoteImport = {
  identifiant: string; // email ou matricule, selon la colonne trouvée
  parIdentifiant: "email" | "matricule";
  notesParMatiere: Record<string, number>; // clé = nom de colonne (nom de matière), valeur = note /20
};

export type ResultatParsingNotesExcel = {
  valides: LigneNoteImport[];
  rejetees: LigneRejetee[];
  colonnesMatieres: string[]; // en-têtes de colonnes détectées comme des matières (à faire correspondre ensuite)
};

/**
 * Parse un fichier Excel de notes. Format attendu : une ligne par étudiant,
 * une colonne d'identification (email ou matricule), puis une colonne par
 * matière contenant la note /20. Les colonnes non reconnues comme
 * identifiant sont considérées comme des colonnes de matière.
 *
 * Exemple de fichier :
 *   | Email                  | Statistique | Algèbre |
 *   | etudiant1@example.com  | 14          | 12.5    |
 */
export async function parseExcelNotes(file: File): Promise<ResultatParsingNotesExcel> {
  const buffer = await file.arrayBuffer();
  const classeur = XLSX.read(buffer, { type: "array", cellDates: false });
  const feuille = classeur.Sheets[classeur.SheetNames[0]];
  if (!feuille) return { valides: [], rejetees: [], colonnesMatieres: [] };

  const lignesBrutes: Record<string, unknown>[] = XLSX.utils.sheet_to_json(feuille, { defval: "", raw: true });
  if (lignesBrutes.length === 0) return { valides: [], rejetees: [], colonnesMatieres: [] };

  const entetesOriginaux = Object.keys(lignesBrutes[0]);
  const headersNormalises = new Map<string, string>();
  for (const h of entetesOriginaux) headersNormalises.set(normaliserEnTete(h), h);

  const colEmail = trouverColonne(headersNormalises, ALIAS_EMAIL);
  const colMatricule = trouverColonne(headersNormalises, ALIAS_MATRICULE);

  if (!colEmail && !colMatricule) {
    return { valides: [], rejetees: [{ ligne: 1, raison: "Aucune colonne Email ou Matricule trouvée pour identifier les étudiants", donnees: {} }], colonnesMatieres: [] };
  }

  const colIdentifiant = colEmail ?? colMatricule!;
  const parIdentifiant: "email" | "matricule" = colEmail ? "email" : "matricule";
  const colNomComplet = trouverColonne(headersNormalises, ALIAS_NOM_COMPLET);
  const colNom = trouverColonne(headersNormalises, ALIAS_NOM);
  const colPrenom = trouverColonne(headersNormalises, ["prenom", "prénom", "first name", "firstname"]);
  const colTelephone = trouverColonne(headersNormalises, ALIAS_TELEPHONE);
  const colDateNaissance = trouverColonne(headersNormalises, ALIAS_DATE_NAISSANCE);
  const colonnesAExclure = new Set([colIdentifiant, colNomComplet, colNom, colPrenom, colTelephone, colDateNaissance].filter(Boolean));
  const colonnesMatieres = entetesOriginaux.filter((h) => !colonnesAExclure.has(h));

  const valides: LigneNoteImport[] = [];
  const rejetees: LigneRejetee[] = [];

  lignesBrutes.forEach((ligne, idx) => {
    const numeroLigne = idx + 2;
    const identifiant = String(ligne[colIdentifiant] ?? "").trim();
    if (!identifiant) {
      rejetees.push({ ligne: numeroLigne, raison: `${parIdentifiant === "email" ? "Email" : "Matricule"} manquant`, donnees: ligne });
      return;
    }
    const notesParMatiere: Record<string, number> = {};
    for (const col of colonnesMatieres) {
      const brut = ligne[col];
      if (brut === "" || brut === null || brut === undefined) continue;
      const val = Number(String(brut).replace(",", "."));
      if (!Number.isNaN(val) && val >= 0 && val <= 20) {
        notesParMatiere[col] = val;
      }
    }
    if (Object.keys(notesParMatiere).length === 0) {
      rejetees.push({ ligne: numeroLigne, raison: "Aucune note valide sur cette ligne", donnees: ligne });
      return;
    }
    valides.push({ identifiant: parIdentifiant === "email" ? identifiant.toLowerCase() : identifiant, parIdentifiant, notesParMatiere });
  });

  return { valides, rejetees, colonnesMatieres };
}
