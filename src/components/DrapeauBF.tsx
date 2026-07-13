export function DrapeauBF({ className = "h-6 w-9" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Drapeau du Burkina Faso"
      className={`inline-flex overflow-hidden rounded-sm border border-white/20 shadow-sm ${className}`}
    >
      <span className="flex-1 bg-[#ef2b2d]" />
      <span className="flex-1 bg-[#009e49] relative">
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] leading-none text-[#fcd116]"
          style={{ fontSize: "clamp(8px, 40%, 16px)" }}
        >
          ★
        </span>
      </span>
    </span>
  );
}
