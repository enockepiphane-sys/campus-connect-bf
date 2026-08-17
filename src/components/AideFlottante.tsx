import { useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Headset, X, Search, Mail } from "lucide-react";
import { FAQ, rechercherFaq, type Public } from "@/lib/faq";

export function AideFlottante() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);

  // Le contenu dépend de la zone de l'app, jamais d'un choix libre de l'utilisateur :
  // les questions "administrateur" (gestion étudiants, import Excel, configuration...)
  // ne doivent apparaître que dans les pages admin/super-admin — jamais sur l'accueil
  // public ni côté étudiant, pour ne pas exposer publiquement comment l'établissement
  // est géré en interne.
  const contexte: Public = location.pathname.startsWith("/admin") || location.pathname.startsWith("/super-admin")
    ? "admin"
    : "etudiant";

  const items = useMemo(() => {
    const parContexte = FAQ.filter((f) => f.publicCible === contexte || f.publicCible === "tous");
    return rechercherFaq(parContexte, q);
  }, [q, contexte]);

  const categories = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const arr = map.get(item.categorie) ?? [];
      arr.push(item);
      map.set(item.categorie, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'aide"
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-elegant)] transition hover:scale-105 sm:bottom-6"
        style={{ background: "linear-gradient(135deg, #0F8A44 0%, #D9A61A 100%)" }}
      >
        <Headset className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl bg-surface shadow-2xl sm:h-[80vh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary"><Headset className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-bold leading-tight">Centre d'aide</h2>
                  <p className="text-xs text-muted-foreground">{contexte === "admin" ? "Espace administrateur" : "Espace étudiant"}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une question…"
                  className="input-soft w-full pl-9"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {categories.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <p>Aucun résultat pour cette recherche.</p>
                  <a href="mailto:team@campuslink-bf.app" className="btn-bf-primary mt-4 inline-flex">
                    <Mail className="h-4 w-4" />Contacter le support
                  </a>
                </div>
              )}
              <div className="space-y-5">
                {categories.map(([cat, list]) => (
                  <div key={cat}>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{cat}</h3>
                    <div className="space-y-1.5">
                      {list.map((item) => {
                        const isOpen = ouvert === item.id;
                        return (
                          <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-background/40">
                            <button
                              onClick={() => setOuvert(isOpen ? null : item.id)}
                              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
                            >
                              {item.question}
                              <span className="shrink-0 text-muted-foreground">{isOpen ? "−" : "+"}</span>
                            </button>
                            {isOpen && (
                              <p className="whitespace-pre-line border-t border-border px-4 py-3 text-sm text-muted-foreground">
                                {item.reponse}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-4 text-center text-xs text-muted-foreground">
              Toujours bloqué ?{" "}
              <a href="mailto:team@campuslink-bf.app" className="font-semibold text-primary">team@campuslink-bf.app</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
