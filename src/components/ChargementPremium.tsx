import { DrapeauBF } from "@/components/DrapeauBF";

// -------------- Loaders premium (logo CampusLink) --------------
// Utilisés partout où l'app affichait auparavant un simple "Chargement…".

export function LoaderPleinEcran() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-app">
      <div className="relative grid h-20 w-20 place-items-center">
        <span
          className="absolute inset-0 rounded-full opacity-90 blur-[1px] animate-spin"
          style={{
            background: "conic-gradient(from 0deg, #0F8A44, #167d5e, #D9A61A, #0F8A44)",
            WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            maskImage: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
            animationDuration: "1.4s",
          }}
        />
        <span
          className="relative grid h-14 w-14 place-items-center rounded-full bg-surface shadow-[var(--shadow-elegant)] animate-pulse"
          style={{ animationDuration: "1.8s" }}
        >
          <DrapeauBF className="h-4 w-6 rounded-[2px]" />
        </span>
      </div>
      <div className="font-display text-base font-bold tracking-tight">
        Campus<span className="text-terracotta">Link</span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">Chargement en cours…</p>
    </div>
  );
}

export function LoaderInline({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="relative grid h-10 w-10 place-items-center">
        <span
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: "conic-gradient(from 0deg, #0F8A44, #167d5e, #D9A61A, #0F8A44)",
            WebkitMaskImage: "radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2.5px))",
            maskImage: "radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2.5px))",
            animationDuration: "1.2s",
          }}
        />
        <span
          className="relative grid h-6 w-6 place-items-center rounded-full bg-surface shadow-sm animate-pulse"
          style={{ animationDuration: "1.6s" }}
        >
          <DrapeauBF className="h-2.5 w-4 rounded-[1px]" />
        </span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
