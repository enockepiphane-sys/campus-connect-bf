import type { ComponentProps } from "react";

/**
 * Lecteur vidéo CampusLink : identique à <video controls>, mais sans l'option « Télécharger »
 * du menu (⋮) de Chrome et sans le menu clic-droit « Enregistrer la vidéo sous… ».
 * La vitesse de lecture reste disponible.
 */
export function VideoProtegee(props: ComponentProps<"video">) {
  return (
    <video
      {...props}
      controls
      controlsList="nodownload noremoteplayback"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
