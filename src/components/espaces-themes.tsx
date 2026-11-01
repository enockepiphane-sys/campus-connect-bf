import { Brain, Briefcase, Compass, Library, MonitorPlay, PartyPopper } from "lucide-react";

export type EspaceKey = "revision" | "opportunites" | "bibliotheque" | "cours" | "guide" | "evenements";

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
  cours: {
    to: "/cours-en-ligne",
    label: "Cours en ligne",
    short: "Cours en ligne",
    tagline: "Vidéos, PDF, photos et manuscrits classés par filière, niveau et module.",
    chips: ["Vidéos", "PDF", "Manuscrits", "Par module"],
    gradient: "linear-gradient(135deg, #431407 0%, #c2410c 55%, #e0764f 100%)",
    solid: "#c2410c",
    Icon: MonitorPlay,
  },
  guide: {
    to: "/guide-bachelier",
    label: "Guide du nouveau bachelier",
    short: "Guide bachelier",
    tagline: "Campus Faso expliqué pas à pas : compte, orientation, inscription et résultats.",
    chips: ["Campus Faso", "Orientation", "Inscription", "Résultats"],
    gradient: "linear-gradient(135deg, #0b2a44 0%, #1d6fa5 55%, #4fb3e8 100%)",
    solid: "#1d6fa5",
    Icon: Compass,
  },
  evenements: {
    to: "/evenements",
    label: "Événements",
    short: "Événements",
    tagline: "Concerts, conférences, rencontres et activités : l’agenda de la vie étudiante.",
    chips: ["Concerts", "Conférences", "Rencontres", "Activités"],
    gradient: "linear-gradient(135deg, #052e1c 0%, #0F8A44 55%, #F0C419 100%)",
    solid: "#0F8A44",
    Icon: PartyPopper,
  },
} as const;
