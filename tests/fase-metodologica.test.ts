import { describe, expect, it } from "vitest";
import { derivarFaseMetodologica } from "@/lib/proyectos/fase-metodologica";

describe("derivarFaseMetodologica", () => {
  it.each([
    [0, "contextualizacion"],
    [6, "definicion"],
    [7, "arquitectura"],
    [8, "pilotaje"],
    [9, "transferencia"],
    [10, "anclaje"],
    [11, "anclaje"],
  ] as const)("deriva el hito %i como %s", (ultimoPaso, fase) => {
    const pasos = Array.from({ length: 12 }, (_, indice) => indice <= ultimoPaso);
    expect(derivarFaseMetodologica(pasos)).toBe(fase);
  });

  it("rechaza recorridos incompletos para no inventar una fase", () => {
    expect(() => derivarFaseMetodologica([true])).toThrow(
      "exactamente 12 pasos"
    );
  });
});
