import { describe, expect, test } from "bun:test";
import { grouperCours, niveauxOf, type Niveau } from "../src/lib/cours-groupes";

const cours = (id: string, filieres: string[], niveaux: Niveau[]) => ({ id, filiere: filieres[0], filieres, niveau: niveaux[0], niveaux });

describe("Cours liés à plusieurs niveaux", () => {
  test("un cours L1 + L2 n'apparaît qu'une seule fois dans « tous les cours »", () => {
    const groupes = grouperCours([cours("a", ["Droit"], ["L2", "L1"])]);
    expect(groupes.flatMap(([, l]) => l).map((c) => c.id)).toEqual(["a"]);
    expect(groupes.map(([titre]) => titre)).toEqual(["Droit › L1 + L2"]);
  });

  test("un cours de deux filières n'apparaît qu'une seule fois", () => {
    const groupes = grouperCours([cours("a", ["Droit", "Économie"], ["L1"])]);
    expect(groupes.flatMap(([, l]) => l)).toHaveLength(1);
    expect(groupes[0][0]).toBe("Droit + Économie › L1");
  });

  test("les cours de même combinaison sont rangés ensemble", () => {
    const groupes = grouperCours([cours("a", ["Droit"], ["L1", "L2"]), cours("b", ["Droit"], ["L1"]), cours("c", ["Droit"], ["L2", "L1"])]);
    expect(groupes.map(([t, l]) => [t, l.map((c) => c.id)])).toEqual([
      ["Droit › L1", ["b"]],
      ["Droit › L1 + L2", ["a", "c"]],
    ]);
  });

  test("un niveau en double n'est affiché qu'une fois", () => {
    expect(niveauxOf({ niveau: "L1", niveaux: ["L1", "L1", "L2"] })).toEqual(["L1", "L2"]);
  });
});
