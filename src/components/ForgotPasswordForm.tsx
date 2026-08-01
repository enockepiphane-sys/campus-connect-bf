import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/site-url";
import { humanizeAuthError, withTimeout } from "@/lib/auth-timeout";

const COOLDOWN_SECONDS = 60;

export function ForgotPasswordForm({ backTo }: { backTo: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  // Décompte anti-spam : une nouvelle demande reste possible après le délai,
  // et chaque demande génère un nouveau lien valide (remplace un lien expiré).
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (remaining > 0) {
      setError(`Merci de patienter ${remaining} s avant de redemander un email.`);
      return;
    }
    setBusy(true);
    try {
      const redirectTo = `${getSiteUrl()}/reinitialiser-mot-de-passe`;
      const { error: re } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo }),
        10000,
        "l'envoi de l'email de réinitialisation",
      );
      if (re) {
        console.error("[CampusLink] resetPasswordForEmail failed", {
          email: email.trim(),
          status: (re as { status?: number }).status,
          code: (re as { code?: string }).code,
          message: re.message,
        });
        if (/rate limit|too many|over_email_send_rate_limit|security purposes/i.test(re.message)) {
          setError("Trop de demandes en peu de temps. Réessayez dans quelques minutes.");
        } else {
          setError(humanizeAuthError(re));
        }
      } else {
        setRemaining(COOLDOWN_SECONDS);
        setInfo(
          "Si un compte existe avec cette adresse, un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception (et les spams).",
        );
      }
    } catch (err) {
      console.error("[CampusLink] resetPasswordForEmail exception", err);
      setError(humanizeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {info && (
        <div className="mb-4 rounded bg-primary-soft p-3 text-sm text-primary">{info}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Votre email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-input bg-surface px-3 py-2 outline-none focus:border-primary"
          />
        </div>
        <button disabled={busy || remaining > 0} className="btn-bf-primary w-full disabled:opacity-60">
          {busy
            ? "..."
            : remaining > 0
              ? `Nouvelle demande dans ${remaining} s`
              : "Envoyer le lien de réinitialisation"}
        </button>
      </form>
      <div className="mt-6 text-center">
        <a href={backTo} className="text-sm text-primary underline">
          Retour à la connexion
        </a>
      </div>
    </>
  );
}
