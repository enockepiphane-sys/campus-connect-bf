import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/devenir-partenaire")({
  head: () => ({
    meta: [
      { title: "Devenir partenaire — CampusLink" },
      {
        name: "description",
        content:
          "Votre établissement souhaite rejoindre CampusLink au Burkina Faso ? Envoyez-nous une demande.",
      },
    ],
  }),
  component: Page,
});

const schema = z.object({
  nom_etablissement: z.string().trim().min(2).max(200),
  nom_contact: z.string().trim().min(2).max(120),
  email_contact: z.string().trim().email().max(200),
  telephone_contact: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

function Page() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setError("Veuillez vérifier les informations saisies.");
      return;
    }
    setStatus("sending");
    const { error } = await supabase
      .from("demandes_partenariat")
      .insert(parsed.data);
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
      <p className="mb-6">
        Vous représentez une université ou un institut du Burkina Faso et
        souhaitez rejoindre CampusLink ? Remplissez ce formulaire, notre équipe
        vous recontactera.
      </p>

      {status === "ok" && (
        <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
          Votre demande a bien été envoyée. Merci !
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nom de l'établissement" name="nom_etablissement" required />
        <Field label="Nom du contact" name="nom_contact" required />
        <Field label="Email du contact" name="email_contact" type="email" required />
        <Field label="Téléphone (facultatif)" name="telephone_contact" />
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80">
            Message (facultatif)
          </label>
          <textarea
            name="message"
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-bf-primary disabled:opacity-60"
        >
          {status === "sending" ? "Envoi..." : "Envoyer ma demande"}
        </button>
      </form>
    </PageShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white/80">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={250}
        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400"
      />
    </div>
  );
}
