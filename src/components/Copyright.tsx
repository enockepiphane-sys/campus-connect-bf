// Mention de droits d'auteur : affichée sur l'accueil, « Fonctionnalités » et « À propos » seulement.
export function Copyright({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-xs text-muted-foreground ${className}`}>
      © 2026 SAOUADOGO W E EPIPHANE — Tous droits réservés.
    </p>
  );
}
