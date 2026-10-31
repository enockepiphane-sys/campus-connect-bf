import { Brain, Briefcase, Library } from "lucide-react";

export type EspaceKey = "revision" | "opportunites" | "bibliotheque";

// Thèmes visuels des espaces partagés : un design propre à chaque fonctionnalité.
export const ESPACES = {
  revision: {
    to: "/revision-ia",
    label: "Révision & IA",
    short: "Révision & IA",
    tagline: "Résumés, QCM, fiches et sujets d’entraînement à partir de tes cours PDF ou photos.",
    chips: ["Résumés", "QCM", "Fiches", "Exercices"],
    gradient: "linear-gradient(135deg, #052e1c 0%, #0b6b36 50%, #12A150 100%)",
    solid: "#0F8A44",
    Icon: Brain,
  },
  opportunites: {
    to: "/opportunites",
    label: "Opportunités",
    short: "Opportunités",
    tagline: "Stages, emplois, bourses, concours et formations réunis au même endroit.",
    chips: ["Stages", "Emplois", "Bourses", "Concours"],
    gradient: "linear-gradient(135deg, #431407 0%, #ea580c 55%, #F0C419 100%)",
    solid: "#ea580c",
    Icon: Briefcase,
  },
  bibliotheque: {
    to: "/bibliotheque",
    label: "Bibliothèque",
    short: "Bibliothèque",
    tagline: "Romans, récits, supports de cours et livres à lire ou à télécharger gratuitement.",
    chips: ["Romans", "Cours", "Histoire", "Sciences"],
    gradient: "linear-gradient(135deg, #04302e 0%, #167d78 55%, #2fb6a8 100%)",
    solid: "#167d78",
    Icon: Library,
  },
} as const;
