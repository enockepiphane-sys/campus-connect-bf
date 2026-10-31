import { useCallback, useEffect, useState } from "react";

// Onglet synchronisé avec l'historique du navigateur :
// chaque changement d'onglet crée une « étape », donc le bouton Retour du téléphone
// ramène à l'onglet précédent au lieu de quitter l'espace directement.
// Aucun rechargement : le routeur n'est pas sollicité.
export function useHistoryTab<T extends string>(keys: readonly T[], initial: T, stateKey = "clTab"): [T, (next: T) => void] {
  const read = useCallback((): T => {
    if (typeof window === "undefined") return initial;
    const value = (window.history.state as Record<string, unknown> | null)?.[stateKey];
    return typeof value === "string" && (keys as readonly string[]).includes(value) ? (value as T) : initial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey, initial]);

  const [tab, setTabState] = useState<T>(read);

  useEffect(() => {
    const onPop = () => setTabState(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [read]);

  const setTab = useCallback(
    (next: T) => {
      if (next === tab) return;
      try {
        window.history.pushState({ ...(window.history.state ?? {}), [stateKey]: next }, "");
      } catch {
        /* historique indisponible : on change juste l'onglet */
      }
      setTabState(next);
    },
    [tab, stateKey],
  );

  return [tab, setTab];
}
