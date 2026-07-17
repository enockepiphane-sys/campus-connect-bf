export function DrapeauBF({ className = "h-5 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-label="Drapeau du Burkina Faso">
      <rect width="60" height="20" fill="#EF2B2D" />
      <rect y="20" width="60" height="20" fill="#009E49" />
      <path d="M30 12 L32 18 L26 14 L34 14 L28 18 Z" fill="#FCD116" />
    </svg>
  );
}
