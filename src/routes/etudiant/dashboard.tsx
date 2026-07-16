import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GraduationCap, LogOut } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/etudiant/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Étudiant — CampusLink" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/etudiant/connexion" });
        return;
      }
      setUser({ email: session.user.email || "" });
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <PageShell title="Dashboard Étudiant">
      <div className="card-glass rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Connecté en tant que</p>
            <p className="font-semibold text-foreground">{user?.email}</p>
          </div>
          <button onClick={signOut} className="btn-bf-outline">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
        <p className="text-muted-foreground">
          Bienvenue dans votre espace étudiant. Consultez vos notes, annonces, emploi du temps et événements.
        </p>
      </div>
    </PageShell>
  );
}
