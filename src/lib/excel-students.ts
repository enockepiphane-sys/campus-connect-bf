import * as XLSX from "xlsx";

export const STUDENT_IMPORT_HEADERS = [
  "Nom complet",
  "Email",
  "Date de naissance",
  "Filière",
  "Niveau",
] as const;

export type StudentImportRow = {
  rowNumber: number;
  nom_complet: string;
  email: string;
  date_naissance: string;
  filiere: string;
  niveau: string;
  errors: string[];
};

export type StudentImportReferences = {
  filieres: Array<{ id: string; nom: string }>;
  niveaux: Array<{ id: string; nom: string; filiere_id: string }>;
  existingEmails: Set<string>;
};

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDate(value);
  return String(value).trim();
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function excelSerialToDate(value: number): string | null {
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed?.y || !parsed?.m || !parsed?.d) return null;
  return `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
}

export function normalizeImportDate(value: unknown): { value: string; error?: string } {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { value: "", error: "Date de naissance invalide." };
    return { value: formatDate(value) };
  }
  if (typeof value === "number") {
    const date = excelSerialToDate(value);
    return date ? { value: date } : { value: "", error: "Date de naissance invalide." };
  }

  const raw = cellText(value);
  if (!raw) return { value: "" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === raw) {
      return { value: raw };
    }
  }

  const european = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (european) {
    const [, day, month, year] = european;
    const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const date = new Date(`${normalized}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === normalized) {
      return { value: normalized };
    }
  }

  return { value: raw, error: `Date de naissance invalide : ${raw}` };
}

export async function readStudentWorkbook(file: File): Promise<{
  rows: StudentImportRow[];
  missingHeaders: string[];
}> {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    cellNF: false,
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return { rows: [], missingHeaders: [...STUDENT_IMPORT_HEADERS] };

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: "",
    raw: true,
  });
  const headerRow = (matrix[0] ?? []).map(cellText);
  const headerIndexes = new Map(headerRow.map((header, index) => [normalizeLabel(header), index]));
  const missingHeaders = STUDENT_IMPORT_HEADERS.filter(
    (header) => !headerIndexes.has(normalizeLabel(header)),
  );

  if (missingHeaders.length) return { rows: [], missingHeaders: [...missingHeaders] };

  const indexOf = (header: string) => headerIndexes.get(normalizeLabel(header)) as number;
  const rows = matrix.slice(1).map((cells, index) => {
    const date = normalizeImportDate(cells[indexOf("Date de naissance")]);
    const row: StudentImportRow = {
      rowNumber: index + 2,
      nom_complet: cellText(cells[indexOf("Nom complet")]),
      email: cellText(cells[indexOf("Email")]).toLowerCase(),
      date_naissance: date.value,
      filiere: cellText(cells[indexOf("Filière")]),
      niveau: cellText(cells[indexOf("Niveau")]),
      errors: date.error ? [date.error] : [],
    };
    if (!row.nom_complet && !row.email && !row.date_naissance && !row.filiere && !row.niveau) {
      row.errors = ["Ligne complètement vide."];
    }
    return row;
  });

  return { rows, missingHeaders: [] };
}

export function validateStudentImportRows(
  rows: StudentImportRow[],
  references: StudentImportReferences,
): StudentImportRow[] {
  const emailCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.email) emailCounts.set(row.email, (emailCounts.get(row.email) ?? 0) + 1);
  }

  const filieres = references.filieres.map((filiere) => ({
    ...filiere,
    key: normalizeLabel(filiere.nom),
  }));
  const niveaux = references.niveaux.map((niveau) => ({
    ...niveau,
    key: normalizeLabel(niveau.nom),
  }));

  return rows.map((source) => {
    const row = { ...source, errors: [...source.errors] };
    if (!row.nom_complet) row.errors.push("Nom complet manquant.");
    if (!row.email) row.errors.push("Email manquant.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      row.errors.push(`Email invalide : ${row.email}`);
    }
    if (!row.date_naissance) row.errors.push("Date de naissance manquante.");
    if (!row.filiere) row.errors.push("Filière manquante.");
    if (!row.niveau) row.errors.push("Niveau manquant.");

    const filiere = filieres.find((item) => item.key === normalizeLabel(row.filiere));
    const niveau = niveaux.find((item) => item.key === normalizeLabel(row.niveau));
    if (row.filiere && !filiere) {
      row.errors.push(`La filière « ${row.filiere} » n'existe pas dans cet établissement.`);
    }
    if (row.niveau && !niveau) {
      row.errors.push(`Le niveau « ${row.niveau} » n'existe pas dans cet établissement.`);
    }
    if (filiere && niveau && niveau.filiere_id !== filiere.id) {
      row.errors.push(
        `Le niveau « ${row.niveau} » ne correspond pas à la filière « ${row.filiere} ».`,
      );
    }
    if (row.email && references.existingEmails.has(row.email)) {
      row.errors.push("Cet email existe déjà dans la base.");
    }
    if (row.email && (emailCounts.get(row.email) ?? 0) > 1) {
      row.errors.push("Cet email est présent plusieurs fois dans le fichier.");
    }
    return row;
  });
}

export function downloadStudentTemplate() {
  const sheet = XLSX.utils.aoa_to_sheet([[...STUDENT_IMPORT_HEADERS], ["", "", "", "", ""]]);
  sheet["!cols"] = [{ wch: 28 }, { wch: 32 }, { wch: 20 }, { wch: 24 }, { wch: 18 }];
  const instructions = XLSX.utils.aoa_to_sheet([
    ["Instructions — import des étudiants"],
    ["1. Une ligne correspond à un étudiant."],
    ["2. Ne pas modifier les noms des colonnes."],
    ["3. Remplir toutes les informations obligatoires."],
    ["4. Enregistrer le fichier."],
    ["5. Revenir sur CampusLink et importer le fichier."],
  ]);
  instructions["!cols"] = [{ wch: 78 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Étudiants");
  XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");
  XLSX.writeFile(workbook, "modele_import_etudiants_campuslink.xlsx");
}

export function downloadStudentErrorReport(rows: StudentImportRow[]) {
  const data = rows.map((row) => [
    row.nom_complet,
    row.email,
    row.date_naissance,
    row.filiere,
    row.niveau,
    row.errors.join(" "),
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([[...STUDENT_IMPORT_HEADERS, "Erreur"], ...data]);
  sheet["!cols"] = [{ wch: 28 }, { wch: 32 }, { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 72 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Erreurs");
  XLSX.writeFile(workbook, "rapport_erreurs_import_etudiants.xlsx");
}
