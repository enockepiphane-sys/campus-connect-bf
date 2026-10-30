import { Brain, Briefcase } from "lucide-react";

export type EspaceKey = "revision" | "opportunites";

// Thèmes visuels des deux espaces partagés : un design propre à chaque fonctionnalité.
export const ESPACES = {
  revision: {
    to: "/revision-ia",
    label: "Révision & IA",
    tagline: "Résumés, QCM, fiches et sujets d’entraînement à partir de tes cours PDF.",
    chips: ["Résumés", "QCM", "Fiches", "Exercices"],
    gradient: "linear-gradient(135deg, #052e1c 0%, #0b6b36 50%, #12A150 100%)",
    solid: "#0F8A44",
    Icon: Brain,
  },
  opportunites: {
    to: "/opportunites",
    label: "Opportunités",
    tagline: "Stages, emplois, bourses, concours et formations réunis au même endroit.",
    chips: ["Stages", "Emplois", "Bourses", "Concours"],
    gradient: "linear-gradient(135deg, #431407 0%, #ea580c 55%, #F0C419 100%)",
    solid: "#ea580c",
    Icon: Briefcase,
  },
} as const;
