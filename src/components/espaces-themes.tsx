import { Brain, Briefcase } from "lucide-react";

export type EspaceKey = "revision" | "opportunites";

// Thèmes visuels des deux espaces partagés : un design propre à chaque fonctionnalité.
export const ESPACES = {
  revision: {
    to: "/revision-ia",
    label: "Révision & IA",
    tagline: "Résumés, QCM, fiches et sujets d’entraînement à partir de tes cours PDF.",
    chips: ["Résumés", "QCM", "Fiches", "Exercices"],
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 48%, #7c3aed 100%)",
    solid: "#4f46e5",
    Icon: Brain,
  },
  opportunites: {
    to: "/opportunites",
    label: "Opportunités",
    tagline: "Stages, emplois, bourses, concours et formations réunis au même endroit.",
    chips: ["Stages", "Emplois", "Bourses", "Concours"],
    gradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 52%, #f0b429 100%)",
    solid: "#ea580c",
    Icon: Briefcase,
  },
} as const;
