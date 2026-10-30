import { Link } from "@tanstack/react-router";
import { BookOpen, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
export function EspacesNavigation() {
  return <nav aria-label="Espaces CampusLink" className="my-4 flex flex-wrap gap-2">
    <Button asChild variant="outline"><Link to="/revision-ia"><BookOpen />Révision & IA</Link></Button>
    <Button asChild variant="outline"><Link to="/opportunites"><BriefcaseBusiness />Opportunités</Link></Button>
  </nav>;
}
