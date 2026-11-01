import { DrapeauBF } from "@/components/DrapeauBF";

// Nom de la plateforme + drapeau, identique partout (mêmes couleurs que l'accueil).
export function MarqueCampusLink({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      <span className="whitespace-nowrap text-foreground">
        Campus<span className="text-terracotta">Link</span>
      </span>
      <DrapeauBF className="h-4 w-6 shrink-0 rounded-[2px] shadow-sm" />
    </span>
  );
}
