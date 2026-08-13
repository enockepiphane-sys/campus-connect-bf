import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  downloadStudentErrorReport,
  downloadStudentTemplate,
  readStudentWorkbook,
  STUDENT_IMPORT_HEADERS,
  validateStudentImportRows,
  type StudentImportReferences,
  type StudentImportRow,
} from "@/lib/excel-students";

type Props = { etabId: string };

export function EtudiantsExcelImport({ etabId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<StudentImportRow[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [references, setReferences] = useState<StudentImportReferences | null>(null);

  const errorRows = rows.filter((row) => row.errors.length > 0);
  const validRows = rows.filter((row) => row.errors.length === 0);
  const hasVerification = rows.length > 0 || missingHeaders.length > 0;

  async function loadReferences(): Promise<StudentImportReferences> {
    const { data: filieres, error: filieresError } = await supabase
      .from("filieres")
      .select("id,nom")
      .eq("etablissement_id", etabId)
      .is("deleted_at", null)
      .order("nom");
    if (filieresError) throw filieresError;

    const filiereIds = (filieres ?? []).map((filiere) => filiere.id);
    const { data: niveaux, error: niveauxError } = filiereIds.length
      ? await supabase
          .from("niveaux")
          .select("id,nom,filiere_id")
          .in("filiere_id", filiereIds)
          .is("deleted_at", null)
      : { data: [], error: null };
    if (niveauxError) throw niveauxError;

    const { data: existing, error: existingError } = await supabase
      .from("etudiants_pre_inscrits")
      .select("email")
      .eq("etablissement_id", etabId)
      .is("deleted_at", null);
    if (existingError) throw existingError;

    return {
      filieres: (filieres ?? []) as Array<{ id: string; nom: string }>,
      niveaux: (niveaux ?? []) as Array<{ id: string; nom: string; filiere_id: string }>,
      existingEmails: new Set((existing ?? []).map((row) => row.email.toLowerCase())),
    };
  }

  async function verifyFile(file: File) {
    setMessage(null);
    setFileName(file.name);
    setRows([]);
    setMissingHeaders([]);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setMessage("Format non accepté. Sélectionnez un fichier Excel (.xlsx).");
      return;
    }

    setBusy(true);
    try {
      const [workbook, refs] = await Promise.all([readStudentWorkbook(file), loadReferences()]);
      setReferences(refs);
      setMissingHeaders(workbook.missingHeaders);
      if (workbook.missingHeaders.length === 0) {
        setRows(validateStudentImportRows(workbook.rows, refs));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de lire ce fichier Excel.");
    } finally {
      setBusy(false);
    }
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void verifyFile(file);
    event.target.value = "";
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void verifyFile(file);
  }

  async function confirmImport() {
    if (!references || errorRows.length > 0 || validRows.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée. Reconnectez-vous.");
      const response = await fetch("/api/admin/import-excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map(({ nom_complet, email, date_naissance, filiere, niveau }) => ({
            nom_complet,
            email,
            date_naissance,
            filiere,
            niveau,
          })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (result.error === "validation_failed") {
          throw new Error(
            "Les données ont changé depuis la vérification. Réimportez le fichier pour relancer les contrôles.",
          );
        }
        throw new Error(result.message || "Échec de l'importation.");
      }
      setMessage(`${result.imported} étudiant(s) pré-inscrit(s) avec succès.`);
      setRows([]);
      setMissingHeaders([]);
      setFileName("");
      setReferences(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Échec de l'importation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="card-soft border border-primary/20 p-5 sm:p-6"
      aria-labelledby="excel-import-title"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 id="excel-import-title" className="font-display text-lg font-bold">
              Importer plusieurs étudiants
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Ajoutez rapidement plusieurs étudiants à partir d&apos;un fichier Excel.
          </p>
        </div>
        <button
          type="button"
          className="btn-bf-outline text-sm"
          onClick={downloadStudentTemplate}
          disabled={busy}
        >
          <Download className="h-4 w-4" />
          Télécharger le modèle Excel
        </button>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-4">
        {[
          ["1", "Télécharger le modèle Excel"],
          ["2", "Remplir le fichier"],
          ["3", "Importer et vérifier"],
          ["4", "Confirmer l’importation"],
        ].map(([number, label], index) => (
          <div key={number} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {number}
            </span>
            <span>{label}</span>
            {index < 3 && <span className="hidden text-primary sm:inline">→</span>}
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-lg border border-border bg-surface/60 p-4 text-sm">
        <p className="font-medium">
          Vous souhaitez ajouter plusieurs étudiants ? Téléchargez d&apos;abord notre modèle Excel,
          remplissez-le puis importez-le ici.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Le modèle contient une feuille Étudiants et une feuille Instructions.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
          isDragging
            ? "border-primary bg-primary-soft"
            : "border-border hover:border-primary/60 hover:bg-surface"
        }`}
      >
        <UploadCloud className="mx-auto mb-2 h-8 w-8 text-primary" />
        <p className="font-semibold">Importer votre fichier Excel</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Glissez-déposez votre fichier ici ou cliquez pour le choisir
        </p>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Format accepté : Excel (.xlsx)
        </p>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={onFileChange}
        />
      </div>

      {busy && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Analyse du fichier en cours…
        </div>
      )}
      {message && !busy && (
        <div className="mt-4 rounded-lg bg-primary-soft p-3 text-sm text-primary">{message}</div>
      )}

      {fileName && !busy && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          {fileName}
        </p>
      )}

      {missingHeaders.length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <XCircle className="h-4 w-4" /> Colonnes obligatoires manquantes
          </p>
          <p className="mt-1 text-muted-foreground">
            Ajoutez ces colonnes sans modifier leur nom : {missingHeaders.join(", ")}.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Colonnes attendues : {STUDENT_IMPORT_HEADERS.join(" · ")}
          </p>
        </div>
      )}

      {hasVerification && missingHeaders.length === 0 && rows.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Vérification terminée
            </p>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md bg-primary-soft p-3">
                <strong className="block text-xl text-primary">{validRows.length}</strong>
                étudiants valides
              </div>
              <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
                <strong className="block text-xl text-amber-700 dark:text-amber-400">
                  {errorRows.length}
                </strong>
                étudiants avec des erreurs
              </div>
              <div className="rounded-md bg-muted p-3">
                <strong className="block text-xl">{rows.length}</strong>
                lignes analysées
              </div>
            </div>
          </div>

          {errorRows.length > 0 ? (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50/50 p-4 dark:bg-amber-950/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" /> Corrigez les lignes signalées avant
                  d&apos;importer
                </p>
                <button
                  type="button"
                  className="btn-bf-outline text-xs"
                  onClick={() => downloadStudentErrorReport(errorRows)}
                >
                  <Download className="h-4 w-4" /> Télécharger le rapport des erreurs
                </button>
              </div>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {errorRows.map((row) => (
                  <div
                    key={row.rowNumber}
                    className="rounded-md border border-amber-200 bg-background p-3 text-sm dark:border-amber-900"
                  >
                    <p className="font-semibold">Ligne {row.rowNumber}</p>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {row.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/30 bg-primary-soft p-4">
              <p className="font-semibold text-primary">
                Tous les étudiants sont prêts à être importés.
              </p>
              <p className="mt-1 text-sm text-primary">✅ {validRows.length} étudiants valides</p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="btn-bf-outline"
                  onClick={() => {
                    setRows([]);
                    setFileName("");
                    setReferences(null);
                  }}
                  disabled={busy}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-forest"
                  onClick={confirmImport}
                  disabled={busy}
                >
                  Importer les {validRows.length} étudiants
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
