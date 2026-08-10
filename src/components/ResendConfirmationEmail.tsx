import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/auth-timeout";

const COOLDOWN_SECONDS = 60;
const RESEND_TIMEOUT_MS = 15000;

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

/**
 * Renvoie l'email de confirmation d'inscription (méthode dédiée Supabase).
 * L'expéditeur est défini uniquement par Supabase (Auth > SMTP + sender),
 * pas par le front-end. Pour Resend, configurez SMTP + sender dans Supabase
 * et vérifiez le domaine/adresse côté Resend.
 */
export async function resendSignupEmail(email: string, emailRedirectTo: string) {
  const requestId = crypto.randomUUID();
  const trimmedEmail = email.trim();
  console.info("[resend-confirmation] start", {
    requestId,
    email: trimmedEmail,
    emailRedirectTo,
    flow: "supabase.auth.resend",
    senderSource: "Supabase Auth SMTP sender (Auth > Email > From email)",
  });

  try {
    const { error } = await withTimeout(
      supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: { emailRedirectTo },
      }),
      RESEND_TIMEOUT_MS,
      "le renvoi de l'email de confirmation",
    );

    if (error) {
      const humanized = humanizeResendError(error);
      console.error("[resend-confirmation] supabase.auth.resend failed", {
        requestId,
        error,
        humanized,
      });
      return { error: humanized };
    }

    console.info("[resend-confirmation] success", { requestId });
    return { error: null };
  } catch (err) {
    const humanized = humanizeResendError(err);
    console.error("[resend-confirmation] exception", {
      requestId,
      error: err,
      humanized,
    });
    return { error: humanized };
  }
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
    console.info("[resend-confirmation] button clicked", { email });
    try {
      const { error: re } = await resendSignupEmail(email, emailRedirectTo);
      if (re) {
        setError(`Une erreur est survenue, réessayez. (${re})`);
        return;
      }
      setLeft(COOLDOWN_SECONDS);
      setOk("Email renvoyé.");
    } catch (err) {
      console.error("[resend-confirmation] unexpected onClick exception", err);
      setError("Une erreur est survenue, réessayez.");
    } finally {
      setBusy(false);
    }
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
