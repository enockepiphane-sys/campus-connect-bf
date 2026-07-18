import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/site-url";
import { humanizeAuthError, withTimeout } from "@/lib/auth-timeout";

export function ForgotPasswordForm({ backTo }: { backTo: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const redirectTo = `${getSiteUrl()}/reinitialiser-mot-de-passe`;
      const { error: re } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo }),
        10000,
        "l'envoi de l'email de réinitialisation",
      );
      if (re) {
        setError(humanizeAuthError(re));
      } else {
        setInfo(
          "Si un compte existe avec cette adresse, un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception (et les spams).",
        );
      }
    } catch (err) {
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
        <button disabled={busy} className="btn-bf-primary w-full">
          {busy ? "..." : "Envoyer le lien de réinitialisation"}
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
