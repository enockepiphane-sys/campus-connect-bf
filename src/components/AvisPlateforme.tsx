import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, MessageSquareHeart, Pencil, Star, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LIBELLES_NOTE, db, envoyerAvis, monAvis, rappelAvisDu, reporterRappelAvis, statistiquesAvis, type Avis } from "@/lib/avis";

// ───────── Étoiles ─────────
export function Etoiles({ valeur, taille = "h-5 w-5" }: { valeur: number; taille?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${valeur} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${taille} ${n <= Math.round(valeur) ? "fill-[#F0C419] text-[#F0C419]" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

function ChoixEtoiles({ valeur, onChange }: { valeur: number; onChange: (n: number) => void }) {
  const [survol, setSurvol] = useState(0);
  const actif = survol || valeur;
  return (
    <div>
      <div className="flex justify-center gap-1.5" onMouseLeave={() => setSurvol(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            aria-pressed={valeur === n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setSurvol(n)}
            className="rounded-full p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Star className={`h-9 w-9 sm:h-10 sm:w-10 ${n <= actif ? "fill-[#F0C419] text-[#F0C419]" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>
      <p className="mt-1 h-5 text-center text-sm font-semibold text-primary">{LIBELLES_NOTE[actif] ?? ""}</p>
    </div>
  );
}

// ───────── Formulaire (utilisé dans la section d'accueil et dans la fenêtre de rappel) ─────────
function FormulaireAvis({ userId, initial, onDone, onCancel }: { userId: string; initial?: Avis | null; onDone: () => void; onCancel?: () => void }) {
  const [note, setNote] = useState(initial?.note ?? 0);
  const [commentaire, setCommentaire] = useState(initial?.commentaire ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const valider = async () => {
    if (note < 1) { setErreur("Choisis d’abord un nombre d’étoiles."); return; }
    setEnvoi(true); setErreur("");
    const err = await envoyerAvis(userId, note, commentaire);
    setEnvoi(false);
    if (err) setErreur(err); else onDone();
  };

  return (
    <div className="space-y-3">
      <ChoixEtoiles valeur={note} onChange={(n) => { setNote(n); setErreur(""); }} />
      <label className="block text-sm font-medium" htmlFor="avis-commentaire">Pourquoi cette note ? <span className="font-normal text-muted-foreground">(facultatif)</span></label>
      <textarea
        id="avis-commentaire"
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value.slice(0, 1000))}
        rows={4}
        placeholder="Ce que tu aimes, ce qui manque, tes suggestions…"
        className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <p className="text-right text-[11px] text-muted-foreground">{commentaire.length}/1000</p>
      {erreur && <p role="alert" className="text-sm font-medium text-destructive">{erreur}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={valider} disabled={envoi} className="btn-bf-primary flex-1 disabled:opacity-60">
          <Star className="h-4 w-4" />{envoi ? "Envoi…" : initial ? "Mettre à jour mon avis" : "Envoyer mon avis"}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-bf-outline flex-1">{initial ? "Annuler" : "Plus tard"}</button>}
      </div>
    </div>
  );
}

// ───────── Session du membre (inscription primaire) ─────────
function useMembreConnecte() {
  const [etat, setEtat] = useState<{ pret: boolean; userId: string | null }>({ pret: false, userId: null });
  useEffect(() => {
    let actif = true;
    const verifier = async (uid: string | undefined) => {
      if (!uid) { if (actif) setEtat({ pret: true, userId: null }); return; }
      const { data } = await db.from("membres").select("user_id").eq("user_id", uid).maybeSingle();
      if (actif) setEtat({ pret: true, userId: data ? uid : null });
    };
    void supabase.auth.getSession().then(({ data }) => verifier(data.session?.user.id));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { void verifier(s?.user.id); });
    return () => { actif = false; data.subscription.unsubscribe(); };
  }, []);
  return etat;
}

// ───────── Section « Notez CampusLink » (sous les événements sociaux) ─────────
export function AvisPlateformeSection() {
  const { pret, userId } = useMembreConnecte();
  const [avis, setAvis] = useState<Avis | null>(null);
  const [stats, setStats] = useState({ moyenne: 0, total: 0 });
  const [edition, setEdition] = useState(false);
  const [merci, setMerci] = useState(false);

  const charger = async () => {
    setStats(await statistiquesAvis());
    if (userId) {
      const a = await monAvis(userId);
      setAvis(a);
      // La réponse du super admin est marquée comme lue dès qu'elle est affichée.
      if (a?.reponse && !a.reponse_lue) void db.from("avis_plateforme").update({ reponse_lue: true }).eq("user_id", userId);
    } else setAvis(null);
  };
  useEffect(() => {
    if (!pret) return;
    void charger();
    const maj = () => { void charger(); };
    window.addEventListener("cl-avis-change", maj);
    return () => window.removeEventListener("cl-avis-change", maj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, userId]);

  return (
    <section id="avis" aria-labelledby="avis-titre" className="mx-auto mt-16 max-w-2xl scroll-mt-24">
      <div className="card-glass rounded-3xl p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
          <MessageSquareHeart className="h-4 w-4" />Ton avis compte
        </p>
        <h2 id="avis-titre" className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Note CampusLink</h2>
        {stats.total > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Etoiles valeur={stats.moyenne} taille="h-4 w-4" />
            <span className="font-semibold text-foreground">{stats.moyenne.toLocaleString("fr-FR")}/5</span>
            <span>· {stats.total} avis</span>
          </p>
        )}

        <div className="mt-5">
          {!pret && <p className="text-sm text-muted-foreground">Chargement…</p>}

          {pret && !userId && (
            <div>
              <p className="text-sm text-muted-foreground">Crée ton compte gratuit (ou connecte-toi) pour donner une note et ton avis sur la plateforme.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link to="/inscription" search={{ retour: "/" }} className="btn-bf-primary flex-1"><UserPlus className="h-4 w-4" />Créer mon compte</Link>
                <Link to="/connexion" search={{ retour: "/" }} className="btn-bf-outline flex-1"><LogIn className="h-4 w-4" />Me connecter</Link>
              </div>
            </div>
          )}

          {pret && userId && (!avis || edition) && (
            <FormulaireAvis
              userId={userId}
              initial={avis}
              onCancel={avis ? () => setEdition(false) : undefined}
              onDone={() => { setEdition(false); setMerci(true); void charger(); }}
            />
          )}

          {pret && userId && avis && !edition && (
            <div className="space-y-3">
              {merci && <p className="rounded-xl bg-primary-soft px-4 py-2 text-sm font-semibold text-primary">Merci pour ton avis ! 💚</p>}
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ton avis</p>
                <div className="mt-1 flex items-center gap-2"><Etoiles valeur={avis.note} /><span className="text-sm font-semibold">{LIBELLES_NOTE[avis.note]}</span></div>
                {avis.commentaire && <p className="mt-2 whitespace-pre-line text-sm">{avis.commentaire}</p>}
              </div>
              {avis.reponse && (
                <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Réponse de l’équipe CampusLink</p>
                  <p className="mt-1 whitespace-pre-line text-sm">{avis.reponse}</p>
                </div>
              )}
              <button type="button" onClick={() => { setMerci(false); setEdition(true); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline">
                <Pencil className="h-3.5 w-3.5" />Modifier mon avis
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ───────── Fenêtre de rappel : apparaît pendant l'utilisation, revient tant que le membre n'a pas noté ─────────
export function RappelAvis() {
  const { pret, userId } = useMembreConnecte();
  const [ouvert, setOuvert] = useState(false);
  const [fini, setFini] = useState(false);
  const verifie = useRef(false);

  useEffect(() => {
    if (!pret || !userId || verifie.current) return;
    verifie.current = true;
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      if (!rappelAvisDu()) return;
      if (await monAvis(userId)) return; // a déjà noté : on ne redemande plus
      minuteur = setTimeout(() => setOuvert(true), 20000); // après quelques secondes d'utilisation
    })();
    return () => { if (minuteur) clearTimeout(minuteur); };
  }, [pret, userId]);

  const plusTard = () => { reporterRappelAvis(); setOuvert(false); };

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") plusTard(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  if (!ouvert || !userId) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={plusTard}>
      <div role="dialog" aria-modal="true" aria-labelledby="rappel-avis-titre" onClick={(e) => e.stopPropagation()} className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl">
        <button type="button" onClick={plusTard} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        {fini ? (
          <div className="py-6 text-center">
            <p className="text-4xl">💚</p>
            <h2 className="mt-2 font-display text-xl font-bold">Merci pour ton avis !</h2>
            <p className="mt-1 text-sm text-muted-foreground">Il nous aide à améliorer CampusLink.</p>
            <button type="button" onClick={() => setOuvert(false)} className="btn-bf-primary mt-5 w-full">Fermer</button>
          </div>
        ) : (
          <>
            <h2 id="rappel-avis-titre" className="pr-8 font-display text-xl font-bold">Tu aimes CampusLink ?</h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Note l’application en quelques secondes et dis-nous pourquoi.</p>
            <FormulaireAvis userId={userId} onCancel={plusTard} onDone={() => setFini(true)} />
          </>
        )}
      </div>
    </div>
  );
}
