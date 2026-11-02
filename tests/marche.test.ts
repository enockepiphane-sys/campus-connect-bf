import { describe, expect, test } from "bun:test";
import { formatPrix, parsePrix, telLink, validateAnnonce, whatsappLink, type AnnonceInput } from "../src/lib/marche";
import { safeSharedDestination } from "../src/lib/opportunites-model";

const valide: AnnonceInput = {
  type_annonce: "vente", categorie: "Livres", titre: "Cours de droit civil L2", description: "Très bon état, quelques notes au crayon.",
  prix: "2 500", ville: "Ouagadougou", universite: "", contact: "70 00 00 00", auteur_nom: "Awa",
};

describe("Marché étudiant", () => {
  test("prix : vide = à discuter, 0 = gratuit, espaces tolérés", () => {
    expect(parsePrix("")).toBeNull();
    expect(parsePrix("2 500")).toBe(2500);
    expect(formatPrix(null)).toBe("Prix à discuter");
    expect(formatPrix(0)).toBe("Gratuit");
    expect(formatPrix(45000, "colocation")).toContain("/ mois");
  });
  test("annonce valide acceptée, champs invalides refusés", () => {
    expect(validateAnnonce(valide)).toBeNull();
    expect(validateAnnonce({ ...valide, titre: "ab" })).not.toBeNull();
    expect(validateAnnonce({ ...valide, contact: "abc" })).not.toBeNull();
    expect(validateAnnonce({ ...valide, prix: "12abc" })).not.toBeNull();
  });
  test("liens de contact : indicatif +226 ajouté aux numéros à 8 chiffres", () => {
    expect(whatsappLink("70 00 00 00", "Livre")).toStartWith("https://wa.me/22670000000?text=");
    expect(whatsappLink("+226 70 00 00 00", "Livre")).toStartWith("https://wa.me/22670000000?text=");
    expect(telLink("70 00 00 00")).toBe("tel:70000000");
  });
  test("retour après connexion : /marche autorisé, liens externes refusés", () => {
    expect(safeSharedDestination("/marche")).toBe("/marche");
    expect(safeSharedDestination("https://evil.example")).toBe("/opportunites");
  });
});
