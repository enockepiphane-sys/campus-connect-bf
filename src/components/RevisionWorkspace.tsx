import { useRef, useState } from "react";
import { FileText, Upload, X, MessageCircle, ListChecks, Layers, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REVISION_TOOLS, validatePdf, type RevisionTool } from "@/lib/revision-provider";

const icons = { resume: FileText, assistant: MessageCircle, qcm: ListChecks, fiches: Layers, exercices: PenLine };
// Une couleur par outil pour les reconnaître d’un coup d’œil.
const colors: Record<RevisionTool, string> = {
  resume: "#4f46e5",
  assistant: "#0891b2",
  qcm: "#7c3aed",
  fiches: "#db2777",
  exercices: "#ea580c",
};

export function RevisionWorkspace() {
  const [tool, setTool] = useState<RevisionTool>("resume");
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const current = REVISION_TOOLS.find((item) => item.id === tool);
  const color = colors[tool];
  const CurrentIcon = icons[tool];

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
              onClick={() => setTool(item.id)}
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
              aria-label="Importer un cours PDF"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={async (e) => {
                const selected = e.target.files?.[0];
                if (!selected) return;
                const problem = validatePdf(selected);
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
                  <FileText className="h-7 w-7" />
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
                <span className="font-display text-lg font-bold">Importer un cours PDF</span>
                <span className="text-xs text-muted-foreground">Touchez pour choisir un fichier · PDF · 10 Mo maximum</span>
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
            L’intelligence artificielle n’est pas encore connectée. Aucune génération n’est disponible et votre document reste sur cet appareil.
          </p>
          <Button disabled className="h-auto w-full whitespace-normal py-3.5 text-base sm:w-auto">
            <Sparkles />
            {tool === "assistant" ? "Poser ma question" : "Générer"} · Disponible après activation IA
          </Button>
        </div>
      </section>
    </div>
  );
}
