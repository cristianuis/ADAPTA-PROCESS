import { describe, expect, it } from "vitest";
import { derivarFaseMetodologica } from "@/lib/proyectos/fase-metodologica";

describe("derivarFaseMetodologica", () => {
  it.each([
    [0, "contextualizacion"],
    [1, "definicion"],
    [3, "arquitectura"],
    [7, "pilotaje"],
    [8, "transferencia"],
    [9, "anclaje"],
    [10, "anclaje"],
    [11, "anclaje"],
  ] as const)("deriva el hito %i como %s", (ultimoPaso, fase) => {
    const pasos = Array.from({ length: 12 }, (_, indice) => indice <= ultimoPaso);
    expect(derivarFaseMetodologica(pasos)).toBe(fase);
  });

  it("no adelanta la fase por un entregable aislado si falta la entrevista", () => {
    const pasos = [true, true, false, false, true, false, true, true, false, true, false, false];
    expect(derivarFaseMetodologica(pasos)).toBe("definicion");
  });

  it("rechaza recorridos incompletos para no inventar una fase", () => {
    expect(() => derivarFaseMetodologica([true])).toThrow(
      "exactamente 12 pasos"
    );
  });
});
