import { useRef, useState } from "react";
import { FileText, Upload, X, MessageCircle, ListChecks, Layers, PenLine, Sparkles, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REVISION_TOOLS, validatePdf, type RevisionTool } from "@/lib/revision-provider";
import { supabase } from "@/integrations/supabase/client";
import { CoursRenderer } from "@/components/CoursRenderer";

// Envoie le cours (PDF) et l'outil choisi à la fonction Supabase « campuslink-ai » (Gemini).
type RevisionAiInput = {
  tool: "resume" | "assistant" | "qcm" | "fiches" | "exercices";
  question: string;
  file: File | null;
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Lecture du PDF impossible."));
    reader.readAsDataURL(file);
  });
}

async function runRevisionAi({ tool, question, file }: RevisionAiInput): Promise<string> {
  const pdfBase64 = file ? await toBase64(file) : undefined;
  const { data, error } = await supabase.functions.invoke("campuslink-ai", {
    body: { tool, question, pdfBase64, mimeType: file ? file.type || "application/pdf" : undefined },
  });
  if (error) {
    let message = "Le service IA est indisponible. Réessaie plus tard.";
    try {
      const response = (error as { context?: Response }).context;
      if (response) {
        const body = await response.json();
        if (typeof body?.error === "string") message = body.error;
      }
    } catch {
      /* message par défaut */
    }
    throw new Error(message);
  }
  if (typeof data?.error === "string") throw new Error(data.error);
  if (typeof data?.result !== "string" || !data.result) throw new Error("L’IA n’a pas produit de réponse. Réessaie.");
  return data.result;
}

// Réduit les photos de cahier (souvent très lourdes) avant l'envoi : 2000 px max, JPEG.
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const icons = { resume: FileText, assistant: MessageCircle, qcm: ListChecks, fiches: Layers, exercices: PenLine };
// Une couleur par outil pour les reconnaître d’un coup d’œil.
const colors: Record<RevisionTool, string> = {
  resume: "#0F8A44",
  assistant: "#167d78",
  qcm: "#c08a1e",
  fiches: "#c2603c",
  exercices: "#2b3a33",
};

export function RevisionWorkspace() {
  const [tool, setTool] = useState<RevisionTool>("resume");
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const current = REVISION_TOOLS.find((item) => item.id === tool);
  const color = colors[tool];
  const CurrentIcon = icons[tool];

  async function generate() {
    setError("");
    setResult("");
    if (tool === "assistant" && !question.trim()) {
      setError("Écris ta question sur le cours.");
      return;
    }
    if (tool !== "assistant" && !file) {
      setError("Importe d’abord un cours (PDF ou photo).");
      return;
    }
    setLoading(true);
    try {
      setResult(await runRevisionAi({ tool, question, file }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Outils de révision" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {REVISION_TOOLS.map((item) => {
          const Icon = icons[item.id];
          const active = tool === item.id;
          const c = colors[item.id];
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTool(item.id);
                setResult("");
                setError("");
              }}
              className={`group flex min-h-[132px] flex-col justify-between rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                item.id === "exercices" ? "col-span-2 md:col-span-1" : ""
              } ${active ? "border-transparent text-white shadow-lg" : "border-border bg-surface text-foreground"}`}
              style={active ? { background: `linear-gradient(135deg, ${c} 0%, ${c}cc 100%)` } : undefined}
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-xl"
                style={active ? { background: "rgba(255,255,255,0.22)" } : { background: `${c}1f`, color: c }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-base font-bold leading-tight">{item.label}</span>
                <span className={`mt-1 block text-xs ${active ? "text-white/85" : "text-muted-foreground"}`}>
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="min-w-0 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="h-1.5" style={{ background: color }} />
        <div className="space-y-6 p-5 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: `${color}1f`, color }}>
              <CurrentIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold">{current?.label}</h2>
              <p className="text-sm text-muted-foreground">{current?.description}</p>
            </div>
          </div>

          <div
            className="rounded-2xl border-2 border-dashed p-6 sm:p-10"
            style={{ borderColor: `${color}66`, background: `${color}0d` }}
          >
            <input
              ref={input}
              id="revision-pdf"
              aria-label="Importer un cours (PDF ou photo)"
              type="file"
              accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const selected = e.target.files?.[0];
                if (!selected) return;
                const isImage = /^image\/(jpeg|png|webp)$/.test(selected.type);
                if (isImage) {
                  const compact = await compressImage(selected);
                  if (compact.size > 5 * 1024 * 1024) {
                    setError("La photo est trop lourde (5 Mo maximum).");
                    e.target.value = "";
                    return;
                  }
                  setFile(compact);
                  setError("");
                  return;
                }
                const problem = validatePdf(selected) ?? (selected.size > 5 * 1024 * 1024 ? "Le PDF dépasse 5 Mo." : null);
                if (problem) {
                  setError(problem);
                  e.target.value = "";
                  return;
                }
                const header = new TextDecoder().decode(await selected.slice(0, 1024).arrayBuffer());
                if (!header.includes("%PDF-")) {
                  setError("Le contenu de ce fichier n’est pas un PDF valide.");
                  e.target.value = "";
                  return;
                }
                setFile(selected);
                setError("");
              }}
            />
            {file ? (
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: color }}>
                  {file.type.startsWith("image/") ? <ImageIcon className="h-7 w-7" /> : <FileText className="h-7 w-7" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-all font-semibold">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Retirer le document"
                  onClick={() => {
                    setFile(null);
                    if (input.current) input.current.value = "";
                  }}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="flex w-full flex-col items-center gap-3 py-4 text-center"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full text-white shadow-lg" style={{ background: color }}>
                  <Upload className="h-8 w-8" />
                </span>
                <span className="font-display text-lg font-bold">Importer un cours (PDF ou photo)</span>
                <span className="text-xs text-muted-foreground">Touchez pour choisir un fichier · PDF ou photo (JPG, PNG) · 5 Mo maximum</span>
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {tool === "assistant" && (
            <div className="space-y-2">
              <label htmlFor="revision-question" className="text-sm font-medium">
                Votre question sur le cours
              </label>
              <Textarea
                id="revision-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={4000}
                placeholder="Quelle notion souhaitez-vous approfondir ?"
                className="min-h-32"
              />
            </div>
          )}

          <p role="status" className="rounded-xl border-l-4 border-gold bg-secondary p-4 text-sm">
            Pour un cours manuscrit, prenez une photo nette et bien éclairée, une page à la fois. Votre document est envoyé au service d’intelligence artificielle de Google (Gemini) pour générer la réponse. N’y mettez pas d’informations personnelles.
          </p>
          <Button
            onClick={() => void generate()}
            disabled={loading}
            className="h-auto w-full whitespace-normal py-3.5 text-base text-white hover:brightness-110 sm:w-auto"
            style={{ background: color }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "L’IA travaille… (jusqu’à 1 minute)" : tool === "assistant" ? "Poser ma question" : "Générer"}
          </Button>

          {result && <CoursRenderer text={result} color={color} label={current?.label ?? "Résultat"} />}
        </div>
      </section>
    </div>
  );
}
