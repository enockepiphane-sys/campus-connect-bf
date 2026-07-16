import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, LogOut, Building2, Users, Mail, Calendar, Plus } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "Super Administrateur — CampusLink" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ etabId: "", nomComplet: "", email: "", dateNaissance: "" });
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }
      setUser({ email: session.user.email || "" });

      // Verify super admin
      const { data: sa } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!sa) {
        await supabase.auth.signOut();
        navigate({ to: "/" });
        return;
      }

      loadData();
    })();
  }, []);

  async function loadData() {
    const { data: etabs } = await supabase.from("etablissements").select("*").order("nom");
    if (etabs) setEtablissements(etabs);
    const { data: adm } = await supabase.from("admins_pre_autorises").select("*, etablissements(nom)").order("created_at", { ascending: false });
    if (adm) setAdmins(adm);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminError(null);
    const { error } = await supabase.from("admins_pre_autorises").insert({
      etablissement_id: newAdmin.etabId,
      nom_complet: newAdmin.nomComplet,
      email: newAdmin.email.trim().toLowerCase(),
      date_naissance: newAdmin.dateNaissance || null,
    });
    if (error) {
      setAdminError(error.message);
      return;
    }
    setNewAdmin({ etabId: "", nomComplet: "", email: "", dateNaissance: "" });
    setShowAddAdmin(false);
    loadData();
  }

  return (
    <PageShell title="Super Administrateur">
      <div className="card-glass rounded-2xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Super Administrateur</p>
              <p className="font-semibold text-foreground">{user?.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="btn-bf-outline">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              <span className="font-semibold">{etablissements.length} établissements</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-accent">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{admins.length} administrateurs pré-autorisés</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Administrateurs pré-autorisés</h2>
          <button onClick={() => setShowAddAdmin(!showAddAdmin)} className="btn-bf-primary">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>

        {showAddAdmin && (
          <form onSubmit={addAdmin} className="mb-6 rounded-xl border border-border bg-surface p-4">
            {adminError && <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{adminError}</div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-foreground/80">Établissement</label>
                <select value={newAdmin.etabId} onChange={(e) => setNewAdmin({ ...newAdmin, etabId: e.target.value })} required className="w-full rounded-lg border border-input bg-paper px-3 py-2 outline-none focus:border-primary">
                  <option value="">Sélectionner...</option>
                  {etablissements.map((e) => (<option key={e.id} value={e.id}>{e.nom}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-foreground/80">Nom complet</label>
                <input value={newAdmin.nomComplet} onChange={(e) => setNewAdmin({ ...newAdmin, nomComplet: e.target.value })} required className="w-full rounded-lg border border-input bg-paper px-3 py-2 outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-foreground/80">Email</label>
                <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} required className="w-full rounded-lg border border-input bg-paper px-3 py-2 outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-foreground/80">Date de naissance</label>
                <input type="date" value={newAdmin.dateNaissance} onChange={(e) => setNewAdmin({ ...newAdmin, dateNaissance: e.target.value })} className="w-full rounded-lg border border-input bg-paper px-3 py-2 outline-none focus:border-primary" />
              </div>
            </div>
            <button type="submit" className="btn-bf-primary mt-3">Pré-autoriser</button>
          </form>
        )}

        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
              <div>
                <p className="font-medium text-foreground">{a.nom_complet}</p>
                <p className="text-sm text-muted-foreground">{a.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{a.etablissements?.nom || "—"}</p>
                <p className={`text-xs ${a.inscrit ? "text-accent" : "text-muted-foreground"}`}>
                  {a.inscrit ? "Inscrit" : "En attente"}
                </p>
              </div>
            </div>
          ))}
          {admins.length === 0 && <p className="text-sm text-muted-foreground">Aucun administrateur pré-autorisé.</p>}
        </div>
      </div>
    </PageShell>
  );
}
