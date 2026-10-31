import { useMemo, useState, type ReactNode } from "react";
import { BookOpen, Check, Copy, Lightbulb, Sparkles } from "lucide-react";

// Affichage « premium » des réponses de l'IA : transforme le texte Markdown
// (#, **, listes, tableaux…) en un vrai document de cours lisible.

/* ---------- Nettoyage du texte reçu ---------- */

const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

function cleanMath(input: string): string {
  return input
    .replace(/\$\$?([^$]+)\$\$?/g, "$1")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1) / ($2)")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\ge(q)?\b/g, "≥")
    .replace(/\\le(q)?\b/g, "≤")
    .replace(/\\approx/g, "≈")
    .replace(/\\rightarrow|\\to\b/g, "→")
    .replace(/\\cdot/g, "·")
    .replace(/_\{?(\d)\}?/g, (_, d: string) => SUB[d] ?? d)
    .replace(/\^\{?(\d)\}?/g, (_, d: string) => SUP[d] ?? d);
}

// Si la réponse arrive encore enveloppée dans {"result": "..."}, on la déballe.
function normalize(raw: string): string {
  let text = raw.trim();
  if (/^\{\s*"result"\s*:/.test(text)) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed?.result === "string") text = parsed.result;
    } catch {
      const start = text.indexOf('"', text.indexOf(":") + 1) + 1;
      const end = text.lastIndexOf('"');
      if (start > 0 && end > start) {
        text = text
          .slice(start, end)
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "  ")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    }
  }
  return cleanMath(text);
}

/* ---------- Analyse du Markdown ---------- */

type Item = { text: string; level: number; num: string | null };
type Block =
  | { t: "h1" | "h2" | "h3" | "h4"; text: string }
  | { t: "hr" }
  | { t: "p"; text: string }
  | { t: "list"; items: Item[] }
  | { t: "quote"; text: string }
  | { t: "table"; head: string[]; rows: string[][] };

const BULLET = /^(\s*)([-*•+])\s+(.*)$/;
const NUMBERED = /^(\s*)(\d+)[.)]\s+(.*)$/;
const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l);
const cells = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function parse(text: string): Block[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trimEnd();
    if (!line.trim()) { i++; continue; }

    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ t: `h${h[1].length}` as "h1", text: h[2].trim() }); i++; continue; }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { blocks.push({ t: "hr" }); i++; continue; }

    if (isTableLine(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableLine(lines[i])) {
        if (!isSeparator(lines[i])) rows.push(cells(lines[i]));
        i++;
      }
      if (rows.length) blocks.push({ t: "table", head: rows[0], rows: rows.slice(1) });
      continue;
    }

    if (BULLET.test(line) || NUMBERED.test(line)) {
      const items: Item[] = [];
      while (i < lines.length) {
        const l = lines[i].trimEnd();
        const b = BULLET.exec(l);
        const n = b ? null : NUMBERED.exec(l);
        if (!b && !n) {
          // ligne de suite d'un point de liste (indentée, non vide)
          if (l.trim() && /^\s{2,}\S/.test(l) && items.length) { items[items.length - 1].text += " " + l.trim(); i++; continue; }
          break;
        }
        const m = (b ?? n)!;
        const indent = m[1].replace(/\t/g, "    ").length;
        items.push({ text: m[3].trim(), level: indent < 2 ? 0 : indent < 6 ? 1 : 2, num: n ? n[2] : null });
        i++;
      }
      blocks.push({ t: "list", items });
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      blocks.push({ t: "quote", text: q.join(" ").trim() });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i]) && !BULLET.test(lines[i]) && !NUMBERED.test(lines[i]) &&
      !isTableLine(lines[i]) && !/^\s*>\s?/.test(lines[i]) && !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i])
    ) { para.push(lines[i].trim()); i++; }
    blocks.push({ t: "p", text: para.join(" ") });
  }
  return blocks;
}

/* ---------- Mise en forme du texte (gras, italique, code) ---------- */

function inline(text: string, color: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith("**") || tok.startsWith("__")) {
      out.push(
        <strong key={k++} className="rounded px-1 py-0.5 font-semibold text-foreground" style={{ background: `${color}1a` }}>
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={k++} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const KEY_SECTION = /(retenir|points? cl[ée]s?|à savoir|essentiel|conclusion|synth[èe]se)/i;

/* ---------- Composant ---------- */

export function CoursRenderer({ text, color, label }: { text: string; color: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const clean = useMemo(() => normalize(text), [text]);
  const blocks = useMemo(() => parse(clean), [clean]);

  const titleBlock = blocks.find((b): b is Extract<Block, { t: "h1" }> => b.t === "h1");
  const title = titleBlock?.text ?? label;
  const body = blocks.filter((b) => b !== titleBlock);

  // Regroupe le contenu : introduction, puis une carte par section (##).
  type Section = { heading: string | null; blocks: Block[] };
  const sections: Section[] = [];
  for (const b of body) {
    if (b.t === "h2") sections.push({ heading: b.text, blocks: [] });
    else {
      if (!sections.length) sections.push({ heading: null, blocks: [] });
      sections[sections.length - 1].blocks.push(b);
    }
  }
  let counter = 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* copie refusée */
    }
  }

  function renderBlock(b: Block, key: number): ReactNode {
    switch (b.t) {
      case "h1":
      case "h2":
        return null;
      case "h3":
      case "h4":
        return (
          <h4 key={key} className="mb-2 mt-7 flex items-center gap-2.5 font-display text-xl font-bold text-foreground sm:text-2xl">
            <span className="h-2.5 w-2.5 shrink-0 rotate-45 rounded-[3px]" style={{ background: color }} />
            {inline(b.text, color)}
          </h4>
        );
      case "hr":
        return <div key={key} className="my-4 h-px bg-border" />;
      case "p":
        return (
          <p key={key} className="my-3 text-[17px] font-medium leading-8 text-foreground sm:text-lg">
            {inline(b.text, color)}
          </p>
        );
      case "quote":
        return (
          <blockquote key={key} className="my-4 rounded-r-2xl border-l-4 bg-muted/60 px-4 py-3 text-[17px] font-medium leading-8 italic sm:text-lg" style={{ borderColor: color }}>
            {inline(b.text, color)}
          </blockquote>
        );
      case "list":
        return (
          <ul key={key} className="my-3 space-y-2">
            {b.items.map((it, n) => (
              <li
                key={n}
                className="flex gap-3 text-[17px] font-medium leading-8 text-foreground sm:text-lg"
                style={{ paddingLeft: it.level * 22 }}
              >
                {it.num ? (
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: color }}>
                    {it.num}
                  </span>
                ) : it.level === 0 ? (
                  <span className="mt-[13px] h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
                ) : (
                  <span className="mt-[13px] h-2.5 w-2.5 shrink-0 rounded-full border-2" style={{ borderColor: color }} />
                )}
                <span className="min-w-0 break-words">{inline(it.text, color)}</span>
              </li>
            ))}
          </ul>
        );
      case "table":
        return (
          <div key={key} className="my-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[420px] border-collapse text-left text-base">
              <thead>
                <tr style={{ background: `${color}1f` }}>
                  {b.head.map((c, n) => (
                    <th key={n} className="px-4 py-2.5 font-display font-bold">
                      {inline(c, color)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, n) => (
                  <tr key={n} className="border-t border-border">
                    {r.map((c, m) => (
                      <td key={m} className="px-4 py-2.5 align-top">
                        {inline(c, color)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  }

  return (
    <article className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg sm:rounded-3xl">
      {/* En-tête du document */}
      <header
        className="relative isolate overflow-hidden px-4 py-7 text-white sm:px-10 sm:py-12"
        style={{ background: `linear-gradient(135deg, #052e1c 0%, ${color} 100%)` }}
      >
        <span aria-hidden className="absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full bg-white/10" />
        <BookOpen aria-hidden strokeWidth={1.1} className="absolute -bottom-6 right-2 -z-10 h-40 w-40 text-white/10" />
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#F0C419]">
          <Sparkles className="h-3.5 w-3.5" />
          {label}
        </p>
        <h3 className="mt-2 break-words font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{inline(title, "#ffffff")}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">Généré par l’IA CampusLink</span>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-neutral-900 transition hover:brightness-95"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      </header>

      {/* Contenu */}
      <div className="space-y-4 p-2.5 sm:space-y-6 sm:p-10">
        {sections.map((s, n) => {
          const key = s.heading !== null && KEY_SECTION.test(s.heading);
          if (s.heading === null) {
            return <div key={n}>{s.blocks.map((b, m) => renderBlock(b, m))}</div>;
          }
          counter += 1;
          if (key) {
            return (
              <section key={n} className="rounded-2xl border-2 p-4 sm:p-8" style={{ borderColor: "#F0C419", background: "#F0C41914" }}>
                <h4 className="flex items-center gap-3 font-display text-2xl font-extrabold">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F0C419] text-neutral-900">
                    <Lightbulb className="h-5 w-5" />
                  </span>
                  {inline(s.heading, color)}
                </h4>
                <div className="mt-2">{s.blocks.map((b, m) => renderBlock(b, m))}</div>
              </section>
            );
          }
          return (
            <section key={n} className="rounded-2xl border border-border bg-background/60 p-4 sm:p-8">
              <h4 className="flex items-center gap-3 font-display text-2xl font-extrabold sm:text-3xl">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-base font-bold text-white" style={{ background: color }}>
                  {counter}
                </span>
                <span className="min-w-0 break-words">{inline(s.heading, color)}</span>
              </h4>
              <div className="mt-2">{s.blocks.map((b, m) => renderBlock(b, m))}</div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
