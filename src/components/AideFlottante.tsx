import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Headset, X, Mail, SendHorizontal } from "lucide-react";
import { FAQ, trouverMeilleuresReponses, type Public } from "@/lib/faq";

type Message =
  | { role: "user"; texte: string }
  | { role: "assistant"; resultats: ReturnType<typeof trouverMeilleuresReponses> };

const MARGE = 8; // distance minimale gardée par rapport aux bords de l'écran
const STOCKAGE_POSITION = "campuslink-aide-position";

export function AideFlottante() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Position du bouton flottant, en pixels depuis le bord bas-droit de
  // l'écran (comme le placement d'origine), pour que l'utilisateur puisse
  // le faire glisser où il veut. Mémorisée d'une visite à l'autre.
  const [pos, setPos] = useState<{ right: number; bottom: number }>({ right: 16, bottom: 24 });
  const [dragging, setDragging] = useState(false);
  const dragInfo = useRef<{ startX: number; startY: number; startRight: number; startBottom: number; moved: boolean } | null>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STOCKAGE_POSITION);
      if (saved) setPos(JSON.parse(saved));
    } catch {
      // Position par défaut conservée si la lecture échoue.
    }
  }, []);

  function clampPosition(right: number, bottom: number) {
    const largeur = boutonRef.current?.offsetWidth ?? 56;
    const hauteur = boutonRef.current?.offsetHeight ?? 76; // bouton + étiquette
    const maxRight = window.innerWidth - largeur - MARGE;
    const maxBottom = window.innerHeight - hauteur - MARGE;
    return {
      right: Math.min(Math.max(right, MARGE), Math.max(maxRight, MARGE)),
      bottom: Math.min(Math.max(bottom, MARGE), Math.max(maxBottom, MARGE)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragInfo.current = { startX: e.clientX, startY: e.clientY, startRight: pos.right, startBottom: pos.bottom, moved: false };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragInfo.current) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragInfo.current.moved = true;
    const next = clampPosition(dragInfo.current.startRight - dx, dragInfo.current.startBottom - dy);
    setPos(next);
  }

  function onPointerUp() {
    setDragging(false);
    if (dragInfo.current) {
      try {
        localStorage.setItem(STOCKAGE_POSITION, JSON.stringify(pos));
      } catch {
        // Pas grave si la sauvegarde échoue : la position reste active pour la session.
      }
    }
    dragInfo.current = null;
  }

  function onBoutonClick() {
    // N'ouvre le panneau que si le geste n'était pas un déplacement —
    // sinon un simple glissement rouvrirait le chat à chaque fois.
    if (dragInfo.current?.moved) return;
    setOpen(true);
  }

  // Le contenu dépend de la zone de l'app, jamais d'un choix libre de l'utilisateur :
  // les questions "administrateur" (gestion étudiants, import Excel, configuration...)
  // ne doivent apparaître que dans les pages admin/super-admin — jamais sur l'accueil
  // public ni côté étudiant, pour ne pas exposer publiquement comment l'établissement
  // est géré en interne.
  const contexte: Public = location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin")
    ? "admin"
    : "etudiant";

  const banqueFaq = FAQ.filter((f) => f.publicCible === contexte || f.publicCible === "tous");

  // La réponse n'apparaît qu'une fois la question envoyée (comme un vrai
  // échange de chat) — jamais pendant la frappe. Les questions pré-écrites
  // de la FAQ ne sont jamais affichées comme une liste à parcourir ; elles
  // servent uniquement, en coulisse, à faire remonter la meilleure réponse.
  function poserQuestion(e: React.FormEvent) {
    e.preventDefault();
    const texte = question.trim();
    if (!texte) return;
    const resultats = trouverMeilleuresReponses(banqueFaq, texte, 3);
    setMessages((prev) => [...prev, { role: "user", texte }, { role: "assistant", resultats }]);
    setQuestion("");
  }

  function fermer() {
    setOpen(false);
    setQuestion("");
    setMessages([]);
  }

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onBoutonClick}
        aria-label="Ouvrir l'aide et le support (déplaçable)"
        className={`fixed z-50 flex touch-none select-none flex-col items-center gap-1 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ right: pos.right, bottom: pos.bottom }}
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-elegant)] transition hover:scale-105"
          style={{ background: "linear-gradient(135deg, #0F8A44 0%, #D9A61A 100%)" }}
        >
          <Headset className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          Aide &amp; Support
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl bg-surface shadow-2xl sm:h-[80vh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary"><Headset className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-bold leading-tight">Aide & Support</h2>
                  <p className="text-xs text-muted-foreground">{contexte === "admin" ? "Espace administrateur" : "Espace étudiant"}</p>
                </div>
              </div>
              <button onClick={fermer} aria-label="Fermer" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
                  <Headset className="h-8 w-8 text-primary/50" />
                  <p>Pose ta question ci-dessous, en tes propres mots.</p>
                  <p className="text-xs">Exemple : « pourquoi je ne vois pas mes notes ? »</p>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      {m.texte}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[85%] space-y-2">
                      {m.resultats.length > 0 ? (
                        <>
                          {m.resultats.map((item) => (
                            <div key={item.id} className="rounded-2xl rounded-bl-sm border border-border bg-background/40 p-4">
                              <p className="mb-1.5 text-sm font-semibold">{item.question}</p>
                              <p className="whitespace-pre-line text-sm text-muted-foreground">{item.reponse}</p>
                            </div>
                          ))}
                          <p className="px-1 text-xs text-muted-foreground">
                            Ce n'est pas ce que tu cherchais ?{" "}
                            <a href="mailto:team@campuslink-bf.app" className="font-semibold text-primary">Écris au support</a>
                          </p>
                        </>
                      ) : (
                        <div className="rounded-2xl rounded-bl-sm border border-border bg-background/40 p-4">
                          <p className="text-sm text-muted-foreground">
                            Je n'ai pas trouvé de réponse à cette question.
                          </p>
                          <a href="mailto:team@campuslink-bf.app" className="btn-bf-primary mt-3 inline-flex">
                            <Mail className="h-4 w-4" />Contacter le support
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            <form onSubmit={poserQuestion} className="flex items-center gap-2 border-t border-border p-4">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Écris ta question ici…"
                className="input-soft flex-1"
                autoFocus
              />
              <button type="submit" aria-label="Envoyer la question" className="btn-bf-primary shrink-0 px-4">
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
