import { Clock, Pin, Megaphone, CalendarDays, GraduationCap, LogOut, Award } from "lucide-react";
import { DrapeauBF } from "@/components/DrapeauBF";

export function PhoneMockup() {
  return (
    <div
      className="mx-auto w-[200px] rounded-[1.8rem] bg-[#1a1a1a] p-2 sm:w-[248px] md:w-[288px]"
      style={{ boxShadow: "0 40px 70px -25px rgba(0,0,0,0.45), 0 12px 30px -18px rgba(0,0,0,0.35)" }}
      aria-label="Aperçu de l'espace étudiant CampusLink"
      role="img"
    >
      <div className="relative overflow-hidden rounded-[1.7rem]" style={{ background: "linear-gradient(160deg, #FDF6E9 0%, #F6FBF3 55%, #FDF0EE 100%)" }}>
        {/* Encoche caméra */}
        <div className="absolute left-1/2 top-1.5 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-[#1a1a1a]" />

        {/* Header */}
        <div className="flex items-center justify-between bg-white px-2.5 pb-1.5 pt-4">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold tracking-tight text-foreground">
              Campus<span className="text-terracotta">Link</span>
            </span>
            <DrapeauBF className="h-2.5 w-4" />
          </div>
          <span className="rounded-full bg-[#e6f4ea] px-1.5 py-0.5 text-[7px] font-semibold text-[#1a7a3e]">
            Étudiant ·
          </span>
        </div>

        <div className="space-y-1.5 px-2.5 pb-1.5 pt-1.5">
          {/* Ligne utilisateur */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-medium text-foreground/70">WENDYAM · —</span>
            <span className="flex items-center gap-0.5 text-[8px] font-semibold icon-danger">
              <LogOut className="h-2.5 w-2.5" />
              Déconnexion
            </span>
          </div>

          {/* Cartes stats */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="card-soft p-1.5">
              <div className="flex items-center gap-1">
                <Award className="h-2.5 w-2.5 icon-green" />
                <span className="text-[7px] font-medium text-muted-foreground">Crédits validés</span>
              </div>
              <div className="mt-0.5 text-[10px] font-bold text-foreground">—</div>
            </div>
            <div className="card-soft p-1.5">
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5 icon-teal" />
                <span className="text-[7px] font-medium text-muted-foreground">Prochain cours</span>
              </div>
              <div className="mt-0.5 text-[9px] font-bold text-foreground">Droit</div>
              <div className="text-[6.5px] text-muted-foreground">Lundi 08:00 · B4</div>
            </div>
          </div>

          {/* Annonce épinglée */}
          <div className="card-soft p-2">
            <div className="mb-1 flex items-center gap-1">
              <span className="rounded-full bg-[#fdece4] px-1.5 py-0.5 text-[6.5px] font-semibold icon-terracotta">
                Annonce
              </span>
              <Pin className="h-2.5 w-2.5 icon-terracotta" />
            </div>
            <div className="text-[9px] font-bold text-foreground">Cours Reporté</div>
            <p className="mt-0.5 text-[7px] leading-snug text-muted-foreground">
              M. de probabilité ne pourra pas être là pour le cours de demain.
            </p>
            <div className="mt-1 text-[6.5px] text-muted-foreground/80">14/07/2026 08:02:04</div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="grid grid-cols-4 gap-0.5 border-t border-border bg-white/80 px-1 pb-2 pt-1.5">
          <NavItem icon={<Megaphone className="h-3 w-3 icon-terracotta" />} label="Annonces" active />
          <NavItem icon={<Clock className="h-3 w-3 icon-teal" />} label="Emploi du temps" />
          <NavItem icon={<CalendarDays className="h-3 w-3 icon-gold" />} label="Événements" />
          <NavItem icon={<GraduationCap className="h-3 w-3 icon-violet" />} label="Mes notes" />
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {icon}
      <span
        className={`text-center text-[6px] leading-tight ${
          active ? "font-semibold text-foreground underline underline-offset-2" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
