export function DrapeauBF({ className = "h-6 w-9" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Drapeau du Burkina Faso"
      className={`relative inline-block overflow-hidden rounded-sm border border-white/20 shadow-sm ${className}`}
    >
      <span className="absolute inset-0 flex flex-col">
        <span className="flex-1 bg-[#ef2b2d]" />
        <span className="flex-1 bg-[#009e49]" />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-[#fcd116]"
        style={{ fontSize: "60%", lineHeight: 1 }}
      >
        ★
      </span>
    </span>
  );
}
