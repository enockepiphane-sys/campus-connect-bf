import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { humanizeAuthError } from "@/lib/auth-timeout";
import { resolveUserRole, dashboardPathForRole } from "@/lib/auth";

export function ConfirmerCompteFlow() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (!tokenHash || !type) {
        setError("Lien invalide ou incomplet.");
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type,
      });

      if (verifyError) {
        setError(humanizeAuthError(verifyError));
        return;
      }

      const role = await resolveUserRole();
      if (!role) {
        setError("Compte confirmé, mais aucun espace trouvé. Contactez l'administration.");
        return;
      }

      navigate({ to: dashboardPathForRole(role) });
    })();
  }, []);

  return (
    <PageShell title="Confirmation du compte">
      {error ? (
        <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : (
        <p className="text-sm text-muted-foreground">Confirmation en cours…</p>
      )}
    </PageShell>
  );
}
