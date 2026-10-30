import { useRef, useState } from "react";
import { FileText, Upload, X, BookOpen, MessageCircle, ListChecks, Layers, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REVISION_TOOLS, validatePdf, type RevisionTool } from "@/lib/revision-provider";
const icons = { resume: FileText, assistant: MessageCircle, qcm: ListChecks, fiches: Layers, exercices: PenLine };
export function RevisionWorkspace() {
  const [tool, setTool] = useState<RevisionTool>("resume"); const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState(""); const [error, setError] = useState(""); const input = useRef<HTMLInputElement>(null);
  const current = REVISION_TOOLS.find(item => item.id === tool);
  return <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
    <nav aria-label="Outils de révision" className="flex flex-wrap gap-2 lg:flex-col">{REVISION_TOOLS.map(item => { const Icon = icons[item.id]; return <Button key={item.id} variant={tool === item.id ? "default" : "outline"} className="h-auto justify-start whitespace-normal px-4 py-3 text-left" aria-pressed={tool === item.id} onClick={() => setTool(item.id)}><Icon />{item.label}</Button>; })}</nav>
    <section className="min-w-0 space-y-6"><div><h2 className="flex items-center gap-2 text-2xl font-bold"><BookOpen className="h-6 w-6 text-primary" />{current?.label}</h2><p className="mt-2 text-muted-foreground">{current?.description}</p></div>
      <div className="rounded-lg border border-dashed border-border bg-surface p-6">
        <input ref={input} id="revision-pdf" aria-label="Importer un cours PDF" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={async e => {
          const selected = e.target.files?.[0]; if (!selected) return;
          const problem = validatePdf(selected); if (problem) { setError(problem); e.target.value = ""; return; }
          const header = new TextDecoder().decode(await selected.slice(0, 1024).arrayBuffer());
          if (!header.includes("%PDF-")) { setError("Le contenu de ce fichier n’est pas un PDF valide."); e.target.value = ""; return; }
          setFile(selected); setError("");
        }} />
        {file ? <div className="flex min-w-0 items-center gap-3"><FileText className="h-8 w-8 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="break-all font-medium">{file.name}</p><p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} Mo</p></div><Button variant="ghost" size="icon" aria-label="Retirer le document" onClick={() => { setFile(null); if (input.current) input.current.value = ""; }}><X /></Button></div>
          : <div className="flex flex-col items-center gap-3 text-center"><Upload className="h-9 w-9 text-primary" /><Button variant="outline" onClick={() => input.current?.click()}>Importer un cours PDF</Button><p className="text-xs text-muted-foreground">PDF · 10 Mo maximum</p></div>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {tool === "assistant" && <div className="space-y-2"><label htmlFor="revision-question" className="text-sm font-medium">Votre question sur le cours</label><Textarea id="revision-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={4000} placeholder="Quelle notion souhaitez-vous approfondir ?" className="min-h-32" /></div>}
      <p role="status" className="border-l-4 border-gold bg-secondary p-4 text-sm">L’intelligence artificielle n’est pas encore connectée. Aucune génération n’est disponible et votre document reste sur cet appareil.</p>
      <Button disabled className="h-auto whitespace-normal py-3">{tool === "assistant" ? "Poser ma question" : "Générer"} · Disponible après activation IA</Button>
    </section>
  </div>;
}
