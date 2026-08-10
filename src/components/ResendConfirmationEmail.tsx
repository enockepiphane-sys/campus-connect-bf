import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/auth-timeout";

const COOLDOWN_SECONDS = 60;
const RESEND_TIMEOUT_MS = 15000;

function stringifyUnknown(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function extractRateLimitSeconds(msg: string): number | null {
  const secMatch = msg.match(/(?:after|in)\s+(\d+)\s*seconds?/i);
  if (secMatch) return Number(secMatch[1]);
  const minMatch = msg.match(/(?:after|in)\s+(\d+)\s*minutes?/i);
  if (minMatch) return Number(minMatch[1]) * 60;
  return null;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    return typeof message === "string" ? message : stringifyUnknown(message);
  }
  return String(err ?? "");
}

/** Message lisible pour les erreurs de renvoi d'email de confirmation. */
export function humanizeResendError(err: unknown): string {
  const msg = extractErrorMessage(err);
  if (/rate limit|too many requests|after \d+ seconds|429/i.test(msg)) {
    const waitSeconds = extractRateLimitSeconds(msg);
    if (waitSeconds && waitSeconds > 0) {
      return `Un lien a déjà été envoyé récemment. Patientez ${waitSeconds} secondes puis réessayez, ou utilisez le lien déjà reçu.`;
    }
    return "Un lien a déjà été envoyé récemment. Patientez un peu puis réessayez, ou utilisez le lien déjà reçu.";
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
    const response = await withTimeout(
      supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: { emailRedirectTo },
      }),
      RESEND_TIMEOUT_MS,
      "le renvoi de l'email de confirmation",
    );
    const { data, error } = response;
    const rawError = stringifyUnknown(error);
    const rawData = stringifyUnknown(data);
    console.info("[resend-confirmation] supabase.auth.resend response", {
      requestId,
      data,
      error,
      rawData,
      rawError,
    });

    if (error) {
      const humanized = humanizeResendError(error);
      console.error("[resend-confirmation] supabase.auth.resend failed", {
        requestId,
        error,
        data,
        rawData,
        rawError,
        humanized,
      });
      return { error: humanized, data, rawData, rawError };
    }

    console.info("[resend-confirmation] success", {
      requestId,
      data,
      rawData,
      rawError,
    });
    return { error: null, data, rawData, rawError };
  } catch (err) {
    const humanized = humanizeResendError(err);
    console.error("[resend-confirmation] exception", {
      requestId,
      error: err,
      rawError: stringifyUnknown(err),
      humanized,
    });
    return { error: humanized, data: null, rawData: "null", rawError: stringifyUnknown(err) };
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
  const [debugPayload, setDebugPayload] = useState<string | null>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  async function onClick() {
    setError(null);
    setOk(null);
    setBusy(true);
    const clickId = crypto.randomUUID();
    console.info("[resend-confirmation] button clicked", { clickId, email });
    try {
      console.info("[resend-confirmation] calling resendSignupEmail", {
        clickId,
        email,
        emailRedirectTo,
      });
      const result = await resendSignupEmail(email, emailRedirectTo);
      console.info("[resend-confirmation] resendSignupEmail returned", {
        clickId,
        result,
        rawData: result.rawData,
        rawError: result.rawError,
      });
      setDebugPayload(
        JSON.stringify(
          {
            clickId,
            rawData: result.rawData,
            rawError: result.rawError,
            error: result.error,
          },
          null,
          2,
        ),
      );
      const { error: re } = result;
      if (re) {
        setError(re);
        return;
      }
      setLeft(COOLDOWN_SECONDS);
      setOk(
        "Email renvoyé. Si vous ne recevez rien, utilisez le lien déjà reçu et réessayez après le délai de sécurité.",
      );
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
      {debugPayload && (
        <details className="rounded border border-border p-2 text-xs">
          <summary className="cursor-pointer">Détails techniques du renvoi</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all">{debugPayload}</pre>
        </details>
      )}
      <p className="text-xs text-muted-foreground">
        Pensez à vérifier votre dossier spam. Un seul email peut être envoyé par minute.
      </p>
    </div>
  );
}
