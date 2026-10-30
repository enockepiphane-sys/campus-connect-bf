import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EspacesShell } from "@/components/EspacesShell";
import { supabase } from "@/integrations/supabase/client";
import { safeSharedDestination } from "@/lib/opportunites-model";
export const Route = createFileRoute("/connexion-espaces")({
  validateSearch: (search: Record<string, unknown>) => ({ retour: safeSharedDestination(search.retour) }),
  head: () => ({ meta: [ { title: "Connexion aux espaces — CampusLink" }, { name: "description", content: "Accédez aux opportunités et à vos révisions avec votre compte CampusLink." }, { property: "og:title", content: "Connexion aux espaces — CampusLink" }, { property: "og:description", content: "Votre compte CampusLink, sans condition de partenariat pour ces espaces." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" } ] }),
  component: Connexion,
});
function Connexion() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const { retour } = Route.useSearch(); const navigate = useNavigate();
  return <EspacesShell title="Connexion"><form className="mx-auto my-8 max-w-md space-y-5" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError("");
    try { const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (failure) throw new Error("Connexion impossible. Vérifiez vos identifiants et la confirmation de votre adresse email."); await navigate({ to: retour }); }
    catch (err) { setError(err instanceof Error ? err.message : "Connexion impossible."); } finally { setBusy(false); }
  }}>
    <div className="space-y-2"><Label htmlFor="shared-email">Adresse email</Label><Input id="shared-email" autoComplete="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="shared-password">Mot de passe</Label><Input id="shared-password" autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy} className="w-full"><LogIn />{busy ? "Connexion…" : "Se connecter"}</Button>
    <div className="flex flex-wrap justify-between gap-3 text-sm"><Link to="/etudiant/mot-de-passe-oublie" className="text-primary underline">Mot de passe oublié ?</Link><Link to="/etudiant/inscription" className="text-primary underline">Inscription étudiant</Link></div>
  </form></EspacesShell>;
}
