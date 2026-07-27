import { describe, expect, it } from "vitest";
import { calcularPorcentajeAdopcion, calcularSemaforo } from "@/lib/adopcion/calcular-adopcion";

describe("calcularPorcentajeAdopcion", () => {
  it("calcula el porcentaje de casos conformes sobre revisados", () => {
    expect(calcularPorcentajeAdopcion(20, 15)).toBe(75);
  });

  it("devuelve 0 si no se revisó ningún caso (evita división por cero)", () => {
    expect(calcularPorcentajeAdopcion(0, 0)).toBe(0);
  });
});

describe("calcularSemaforo", () => {
  it("premia los valores altos cuando mayor es mejor", () => {
    const objetivo = { sentido: "mayor_es_mejor", meta: 90 } as const;
    expect(calcularSemaforo(100, objetivo)).toBe("verde");
    expect(calcularSemaforo(85, objetivo)).toBe("amarillo");
    expect(calcularSemaforo(50, objetivo)).toBe("rojo");
  });

  it("premia los valores bajos cuando menor es mejor", () => {
    const objetivo = { sentido: "menor_es_mejor", meta: 10 } as const;
    expect(calcularSemaforo(8, objetivo)).toBe("verde");
    expect(calcularSemaforo(11, objetivo)).toBe("amarillo");
    expect(calcularSemaforo(15, objetivo)).toBe("rojo");
  });

  it("evalúa un rango objetivo con límites inclusivos", () => {
    const objetivo = {
      sentido: "rango_objetivo",
      limiteInferior: 18,
      limiteSuperior: 22,
    } as const;
    expect(calcularSemaforo(20, objetivo)).toBe("verde");
    expect(calcularSemaforo(22.3, objetivo)).toBe("amarillo");
    expect(calcularSemaforo(25, objetivo)).toBe("rojo");
  });

  it("rechaza rangos invertidos", () => {
    expect(() =>
      calcularSemaforo(20, {
        sentido: "rango_objetivo",
        limiteInferior: 22,
        limiteSuperior: 18,
      })
    ).toThrow("inferior");
  });
});
