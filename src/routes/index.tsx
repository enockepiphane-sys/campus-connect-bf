import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, ShieldCheck, LogIn, UserPlus, Mail, Building2, Phone, MessageSquare, Send } from "lucide-react";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { DrapeauBF } from "@/components/DrapeauBF";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusLink — La plateforme des campus du Burkina Faso" },
      {
        name: "description",
        content:
          "CampusLink connecte les universités, administrateurs et étudiants du Burkina Faso : annonces, emplois du temps, notes et événements en un seul espace.",
      },
      { property: "og:title", content: "CampusLink — Campus du Burkina Faso" },
      {
        property: "og:description",
        content:
          "La plateforme dédiée aux universités et étudiants du Burkina Faso.",
      },
    ],
  }),
  component: Home,
});

const partnerSchema = z.object({
  nom_etablissement: z.string().trim().min(2).max(200),
  nom_contact: z.string().trim().min(2).max(120),
  email_contact: z.string().trim().email().max(200),
  telephone_contact: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

function Home() {
  return (
    <div className="bg-paper min-h-screen text-foreground">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Campus<span className="text-terracotta">Link</span>
            </span>
            <DrapeauBF className="h-5 w-8" />
          </div>
        </div>
        <HamburgerMenu />
      </header>

      {/* Kente accent */}
      <div className="kente-stripe mx-auto mt-2 h-1.5 w-full max-w-7xl rounded-full opacity-80" />

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-16">
        <div className="text-center">
          <span className="inline-block rounded-full border border-primary/20 bg-primary-soft px-4 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            Burkina Faso
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-foreground md:text-6xl">
            La vie universitaire, <br />
            <span className="text-gradient-bf">simplement connectée.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            CampusLink relie les universités, leurs administrateurs et leurs
            étudiants du Burkina Faso : notes, annonces, emplois du temps et
            événements dans un espace sécurisé.
          </p>
        </div>

        {/* Deux blocs d'accès */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          {/* Étudiant */}
          <section className="card-glass group rounded-2xl p-8 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary-soft text-primary">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Espace Étudiant
                </h2>
                <p className="text-sm text-muted-foreground">
                  Notes, annonces, emploi du temps
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/etudiant/inscription" className="btn-bf-primary">
                <UserPlus className="h-4 w-4" />
                S'inscrire au compte étudiant
              </Link>
              <Link to="/etudiant/connexion" className="btn-bf-outline">
                <LogIn className="h-4 w-4" />
                Se connecter au compte étudiant
              </Link>
            </div>
          </section>

          {/* Administrateur */}
          <section className="card-glass group rounded-2xl p-8 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
            <div className="mb-6 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-accent text-accent-foreground">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Espace Administrateur
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filières, niveaux, listes étudiantes
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/admin/inscription" className="btn-bf-primary">
                <UserPlus className="h-4 w-4" />
                S'inscrire à mon compte administrateur
              </Link>
              <Link to="/admin/connexion" className="btn-bf-outline">
                <LogIn className="h-4 w-4" />
                Se connecter à mon compte administrateur
              </Link>
            </div>
          </section>
        </div>

        {/* Devenir partenaire */}
        <PartnerSection />

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <Logo className="h-10 w-10" />
          <p className="text-center text-xs text-muted-foreground">
            CampusLink — Une plateforme pensée pour les campus du Burkina Faso 🇧🇫
          </p>
        </div>
      </main>
    </div>
  );
}

function PartnerSection() {
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
    <section className="mx-auto mt-16 max-w-3xl">
      <div className="card-glass rounded-2xl p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Devenir partenaire</h2>
          <p className="mt-2 text-sm text-muted-foreground">
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
          <PartnerField icon={<Building2 className="h-4 w-4" />} label="Nom de l'établissement" name="nom_etablissement" required />
          <PartnerField icon={<UserPlus className="h-4 w-4" />} label="Nom du responsable" name="nom_contact" required />
          <PartnerField icon={<Mail className="h-4 w-4" />} label="Email professionnel" name="email_contact" type="email" required />
          <PartnerField icon={<Phone className="h-4 w-4" />} label="Téléphone (facultatif)" name="telephone_contact" />
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground/80">
              <MessageSquare className="h-4 w-4" />
              Message (facultatif)
            </label>
            <textarea
              name="message"
              rows={4}
              maxLength={2000}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-bf-primary w-full disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {status === "sending" ? "Envoi..." : "Envoyer ma demande"}
          </button>
        </form>
      </div>
    </section>
  );
}

function PartnerField({
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
      <input
        name={name}
        type={type}
        required={required}
        maxLength={250}
        className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-foreground outline-none focus:border-primary"
      />
    </div>
  );
}
