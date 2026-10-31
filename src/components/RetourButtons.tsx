import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

// « Retour » ramène à l'écran précédent (et non à l'accueil) ; « Accueil » est un bouton séparé.
function canGoBack() {
  if (typeof window === "undefined") return false;
  const index = (window.history.state as { __TSR_index?: number } | null)?.__TSR_index;
  return typeof index === "number" ? index > 0 : false;
}

export function RetourButtons({ className = "mb-4" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (canGoBack()) window.history.back();
          else window.location.assign("/");
        }}
      >
        <ArrowLeft />
        Retour
      </Button>
      <Button asChild variant="ghost">
        <Link to="/">
          <Home />
          Accueil
        </Link>
      </Button>
    </div>
  );
}
