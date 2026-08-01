import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/site-url";
import { humanizeAuthError, withTimeout } from "@/lib/auth-timeout";

const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = "campuslink:last-verification-resend";

function readLastSent(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, number>;
    return map[email.trim().toLowerCase()] ?? 0;
  } catch {
    return 0;
  }
}

function writeLastSent(email: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[email.trim().toLowerCase()] = Date.now();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* stockage indisponible : la limitation serveur Supabase reste active */
  }
}

/**
 * Renvoi de l'email de vérification (Supabase Auth `resend`, type "signup").
 * Chaque appel génère un NOUVEAU lien valide et invalide le précédent :
 * un lien expiré est donc remplacé simplement en redemandant un envoi.
 * Une limitation anti-spam côté client (60 s) complète celle de Supabase.
 */
export function ResendVerificationForm({
  redirectPath,
  defaultEmail = "",
}: {
  redirectPath: string;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  // Décompte du délai anti-spam pour l'email saisi.
  useEffect(() => {
    const tick = () => {
      const last = email.trim() ? readLastSent(email) : 0;
      const left = last ? Math.max(0, COOLDOWN_SECONDS - Math.floor((Date.now() - last) / 1000)) : 0;
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const target = email.trim();
    if (!target) return;
    if (remaining > 0) {
      setError(`Merci de patienter ${remaining} s avant de redemander un email.`);
      return;
    }
    setBusy(true);
    try {
      const { error: re } = await withTimeout(
        supabase.auth.resend({
          type: "signup",
          email: target,
          options: { emailRedirectTo: `${getSiteUrl()}${redirectPath}` },
        }),
        10000,
        "l'envoi de l'email de vérification",
      );
      if (re) {
        console.error("[CampusLink] resend signup email failed", {
          email: target,
          status: (re as { status?: number }).status,
          code: (re as { code?: string }).code,
          message: re.message,
        });
        if (/already confirmed|already been confirmed/i.test(re.message)) {
          setInfo("Cette adresse est déjà vérifiée : connectez-vous directement.");
        } else if (/rate limit|too many|over_email_send_rate_limit|security purposes/i.test(re.message)) {
          setError("Trop de demandes en peu de temps. Réessayez dans quelques minutes.");
        } else {
          setError(humanizeAuthError(re));
        }
        return;
      }
      writeLastSent(target);
      setRemaining(COOLDOWN_SECONDS);
      setInfo(
        "Un nouvel email de vérification vient d'être envoyé. Le lien précédent n'est plus valide. Pensez à vérifier vos spams.",
      );
    } catch (err) {
      console.error("[CampusLink] resend signup email exception", err);
      setError(humanizeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded border border-border bg-surface/60 p-4">
      <p className="mb-2 text-sm font-medium">Email de vérification non reçu ou lien expiré ?</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Saisissez votre adresse pour recevoir un nouveau lien de vérification.
      </p>
      {error && <div className="mb-3 rounded bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
      {info && <div className="mb-3 rounded bg-primary-soft p-2 text-xs text-primary">{info}</div>}
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="w-full rounded border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button disabled={busy || remaining > 0} className="btn-bf-outline w-full text-sm disabled:opacity-60">
          {busy
            ? "Envoi…"
            : remaining > 0
              ? `Renvoyer dans ${remaining} s`
              : "Renvoyer l'email de vérification"}
        </button>
      </form>
    </div>
  );
}
