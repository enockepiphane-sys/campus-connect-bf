import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Renvoie automatiquement un email de vérification (Supabase Auth `resend`,
 * type "signup") lorsqu'une connexion échoue parce que l'email n'est pas
 * confirmé. Chaque appel génère un NOUVEAU lien valide et invalide le
 * précédent : un lien expiré est donc remplacé sans action de l'utilisateur.
 * Aucune interface dédiée : la fonction renvoie simplement le message à
 * afficher dans le bandeau d'erreur/information existant.
 */
export async function resendSignupVerification(
  email: string,
  redirectPath: string,
): Promise<string> {
  const target = email.trim();
  if (!target) return "Votre email n'est pas encore vérifié.";
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${getSiteUrl()}${redirectPath}` },
    });
    if (error) {
      if (/already confirmed|already been confirmed/i.test(error.message)) {
        return "Cette adresse est déjà vérifiée : réessayez de vous connecter.";
      }
      if (/rate limit|too many|over_email_send_rate_limit|security purposes/i.test(error.message)) {
        return "Votre email n'est pas encore vérifié. Un email a déjà été envoyé récemment : vérifiez votre boîte de réception et vos spams.";
      }
      console.error("[CampusLink] resend signup email failed", error);
      return "Votre email n'est pas encore vérifié. L'envoi d'un nouveau lien a échoué, réessayez dans quelques minutes.";
    }
    return "Votre email n'est pas encore vérifié. Un nouveau lien de vérification vient de vous être envoyé (pensez à vérifier vos spams).";
  } catch (err) {
    console.error("[CampusLink] resend signup email exception", err);
    return "Votre email n'est pas encore vérifié. L'envoi d'un nouveau lien a échoué, réessayez dans quelques minutes.";
  }
}
