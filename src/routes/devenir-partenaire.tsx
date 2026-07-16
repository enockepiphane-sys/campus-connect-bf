import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, UserPlus, Mail, Phone, MessageSquare, Send } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/devenir-partenaire")({
  head: () => ({
    meta: [{ title: "Devenir partenaire — CampusLink" }],
  }),
  component: Page,
});

const partnerSchema = z.object({
  nom_etablissement: z.string().trim().min(2).max(200),
  nom_contact: z.string().trim().min(2).max(120),
  email_contact: z.string().trim().email().max(200),
  telephone_contact: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

function Page() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = partnerSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setError("Veuillez vérifier les informations saisies.");
      return;
    }
    setStatus("sending");
    const { error } = await supabase.from("demandes_partenariat").insert(parsed.data);
    if (error) {
      setStatus("error");
      setError("Une erreur est survenue. Réessayez plus tard.");
      return;
    }
    setStatus("ok");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <PageShell title="Devenir partenaire">
      <div className="card-glass rounded-2xl p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            Votre établissement souhaite rejoindre CampusLink ? Envoyez-nous une demande, notre équipe vous recontactera.
          </p>
        </div>

        {status === "ok" && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary-soft p-4 text-primary">
            Votre demande a bien été envoyée. Merci !
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Field icon={<Building2 className="h-4 w-4" />} label="Nom de l'établissement" name="nom_etablissement" required />
          <Field icon={<UserPlus className="h-4 w-4" />} label="Nom du responsable" name="nom_contact" required />
          <Field icon={<Mail className="h-4 w-4" />} label="Email professionnel" name="email_contact" type="email" required />
          <Field icon={<Phone className="h-4 w-4" />} label="Téléphone (facultatif)" name="telephone_contact" />
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">
              <MessageSquare className="h-4 w-4" />
              Message (facultatif)
            </label>
            <textarea name="message" rows={4} maxLength={2000} className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary" />
          </div>
          <button type="submit" disabled={status === "sending"} className="btn-bf-primary w-full disabled:opacity-60">
            <Send className="h-4 w-4" />
            {status === "sending" ? "Envoi..." : "Envoyer ma demande"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function Field({
  icon,
  label,
  name,
  type = "text",
  required,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">
        {icon}
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input name={name} type={type} required={required} maxLength={250} className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary" />
    </div>
  );
}
