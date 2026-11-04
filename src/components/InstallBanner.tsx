import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Smartphone, X } from "lucide-react";
import { canPromptInstall, isIos, isStandalone, promptInstall, subscribeInstall } from "@/lib/pwa";
import { trackVisit } from "@/lib/visites";

export function useInstall() {
  const [, refresh] = useState(0);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => subscribeInstall(() => refresh((n) => n + 1)), []);
  useEffect(() => setStandalone(isStandalone()), []);
  return {
    canPrompt: canPromptInstall(),
    ios: isIos(),
    standalone,
    async install() {
      const result = await promptInstall();
      if (result === "accepted") trackVisit("installation", "device");
      return result;
    },
  };
}

const SHOW_ON = ["/", "/revision-ia", "/opportunites", "/bibliotheque"];

// Bandeau fin proposant d'installer CampusLink sur le téléphone (masqué 14 jours si on le ferme).
export function InstallBanner() {
  const { pathname } = useLocation();
  const { canPrompt, ios, standalone, install } = useInstall();
  const [hidden, setHidden] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    try {
      const last = Number(localStorage.getItem("cl_install_dismissed") ?? 0);
      setHidden(Date.now() - last < 14 * 86400000);
    } catch {
      setHidden(false);
    }
  }, []);

  if (standalone || hidden || !SHOW_ON.includes(pathname) || !(canPrompt || ios)) return null;

  function close() {
    try {
      localStorage.setItem("cl_install_dismissed", String(Date.now()));
    } catch {
      /* stockage indisponible */
    }
    setHidden(true);
  }

  return (
    <div data-install-banner className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <Smartphone className="h-5 w-5 shrink-0" />
        <p className="min-w-0 flex-1 text-sm font-medium leading-tight">
          {help ? "Touchez le bouton Partager de Safari, puis « Sur l’écran d’accueil »." : "Installez CampusLink sur votre téléphone pour y accéder en un clic."}
        </p>
        {!help && (
          <button
            type="button"
            onClick={() => (canPrompt ? void install() : setHelp(true))}
            className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-neutral-900 transition hover:brightness-95"
          >
            Installer
          </button>
        )}
        <button type="button" onClick={close} aria-label="Fermer" className="shrink-0 rounded-full p-1.5 transition hover:bg-white/15">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
