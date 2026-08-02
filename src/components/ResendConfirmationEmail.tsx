import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const COOLDOWN_SECONDS = 60;

/** Message lisible pour les erreurs de renvoi d'email de confirmation. */
export function humanizeResendError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/rate limit|too many requests|after \d+ seconds|429/i.test(msg)) {
    return "Veuillez patienter avant de redemander un email.";
  }
  if (/already confirmed/i.test(msg)) {
    return "Ce compte est déjà confirmé. Vous pouvez vous connecter directement.";
  }
  if (!msg) return "Le renvoi de l'email a échoué. Réessayez dans un instant.";
  return msg;
}

/** Renvoie l'email de confirmation d'inscription (méthode dédiée Supabase). */
export async function resendSignupEmail(email: string, emailRedirectTo: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo },
  });
  return { error: error ? humanizeResendError(error) : null };
}

/**
 * Bouton de renvoi d'email de confirmation avec cooldown visuel de 60 s.
 * `startCooledDown` : true si un envoi vient déjà d'être déclenché.
 */
export function ResendConfirmationEmail({
  email,
  emailRedirectTo,
  startCooledDown = false,
}: {
  email: string;
  emailRedirectTo: string;
  startCooledDown?: boolean;
}) {
  const [left, setLeft] = useState(startCooledDown ? COOLDOWN_SECONDS : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  async function onClick() {
    setError(null); setOk(null); setBusy(true);
    const { error: re } = await resendSignupEmail(email, emailRedirectTo);
    setBusy(false);
    setLeft(COOLDOWN_SECONDS);
    if (re) { setError(re); return; }
    setOk("Un nouvel email de confirmation vient d'être envoyé.");
  }

  const disabled = busy || left > 0;

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="btn-bf-outline w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? "Envoi…"
          : left > 0
            ? `Renvoyer l'email (${left} s)`
            : "Renvoyer l'email de confirmation"}
      </button>
      {ok && <p className="text-xs text-primary">{ok}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Pensez à vérifier votre dossier spam. Un seul email peut être envoyé par minute.
      </p>
    </div>
  );
}
