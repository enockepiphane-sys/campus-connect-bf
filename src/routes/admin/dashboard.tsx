import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, LogOut } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard Administrateur — CampusLink" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [etabNom, setEtabNom] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/admin/connexion" }); return; }
      setUser({ email: session.user.email || "" });
      const { data: role } = await supabase.from("user_roles").select("etablissement_id").eq("user_id", session.user.id).maybeSingle();
      if (role?.etablissement_id) {
        const { data: etab } = await supabase.from("etablissements").select("nom").eq("id", role.etablissement_id).maybeSingle();
        if (etab) setEtabNom(etab.nom);
      }
    })();
  }, []);

  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/" }); }

  return (
    <PageShell title="Dashboard Administrateur">
      <div className="card-glass rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Connecté en tant que</p>
            <p className="font-semibold text-foreground">{user?.email}</p>
            {etabNom && <p className="mt-1 flex items-center gap-2 text-sm text-primary"><Building2 className="h-4 w-4" /> {etabNom}</p>}
          </div>
          <button onClick={signOut} className="btn-bf-outline"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
        <p className="text-muted-foreground">Bienvenue dans votre espace administrateur. Gérez les filières, niveaux, matières, notes, annonces, événements et emplois du temps de votre établissement.</p>
      </div>
    </PageShell>
  );
}
