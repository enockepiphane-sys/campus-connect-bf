import { describe, expect, test } from "bun:test";
import { CATEGORIES, candidatureHref, deadlineState, safeSharedDestination } from "../src/lib/opportunites-model";
import { validatePdf } from "../src/lib/revision-provider";
describe("Règles des nouveaux espaces", () => {
  test("six catégories prévues", () => { expect([...CATEGORIES]).toEqual(["Stages", "Offres d'emploi", "Bourses d'études", "Concours", "Formations", "Appels à candidatures"]); });
  test("la date limite inclut la journée entière", () => { expect(deadlineState("2026-10-30", new Date("2026-10-30T23:59:59Z"))).toBe("soon"); expect(deadlineState("2026-10-30", new Date("2026-10-31T00:00:00Z"))).toBe("expired"); });
  test("aucun lien actif dangereux dans les candidatures", () => { expect(candidatureHref("javascript:alert(1)")).toBeNull(); expect(candidatureHref("https://example.org/apply")).toBe("https://example.org/apply"); });
  test("aucune redirection externe après connexion", () => { expect(safeSharedDestination("https://evil.example")).toBe("/opportunites"); expect(safeSharedDestination("/revision-ia")).toBe("/revision-ia"); });
  test("seuls les PDF sont acceptés", () => { expect(validatePdf({ name: "cours.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 3000 })).not.toBeNull(); expect(validatePdf({ name: "cours.pdf", type: "application/pdf", size: 3000 })).toBeNull(); });
});
