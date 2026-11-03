import { supabase } from "@/integrations/supabase/client";

// Images associées aux contenus (opportunités, guide, cours, bibliothèque).
// Stockées dans un bucket public « contenu-images » ; la base ne garde que le chemin (colonne image_path).
export const IMAGES_BUCKET = "contenu-images";
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_MIMES.join(",");

/** Choix fait dans le formulaire : nouveau fichier et/ou retrait de l'image actuelle. */
export type ImageChoix = { file: File | null; retirer: boolean };
export const aucuneImage = (): ImageChoix => ({ file: null, retirer: false });

export function validerImage(file: File): string | null {
  if (!IMAGE_MIMES.includes(file.type)) return "Image non acceptée : utilisez JPG, PNG ou WebP.";
  if (file.size > 15 * 1024 * 1024) return "Image trop lourde (15 Mo maximum avant compression).";
  return null;
}

export function imageUrl(path: string | null | undefined): string | null {
  return path ? supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl : null;
}

async function compresser(file: File): Promise<File> {
  try {
    if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
    const bitmap = await createImageBitmap(file);
    const echelle = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "image.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function supprimerImage(path: string | null | undefined) {
  if (path) await supabase.storage.from(IMAGES_BUCKET).remove([path]);
}

/**
 * Prépare l'écriture de l'image d'un contenu :
 *  - envoie le nouveau fichier (compressé) s'il y en a un ;
 *  - `patch` est à fusionner dans la ligne enregistrée ({} si rien ne change) ;
 *  - `annuler()` supprime le fichier envoyé si l'enregistrement en base échoue ;
 *  - `valider()` supprime l'ancienne image quand elle est remplacée ou retirée.
 */
export async function preparerImage(choix: ImageChoix | undefined, actuel: string | null | undefined, dossier: string) {
  let nouveau: string | null = null;
  if (choix?.file) {
    const err = validerImage(choix.file);
    if (err) throw new Error(err);
    const fichier = await compresser(choix.file);
    nouveau = `${dossier}/${crypto.randomUUID()}.${EXT[fichier.type] ?? "jpg"}`;
    const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(nouveau, fichier, { contentType: fichier.type });
    if (error) throw new Error("L’envoi de l’image a échoué (" + error.message + ").");
  }
  const change = nouveau !== null || (choix?.retirer ?? false);
  return {
    patch: (change ? { image_path: nouveau } : {}) as { image_path?: string | null },
    annuler: () => supprimerImage(nouveau),
    valider: () => (change ? supprimerImage(actuel) : Promise.resolve()),
  };
}
