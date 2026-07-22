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
  it("verde cuando el valor cumple o supera la meta", () => {
    expect(calcularSemaforo(100, 90)).toBe("verde");
  });

  it("amarillo cuando está dentro del 10% por debajo de la meta", () => {
    expect(calcularSemaforo(85, 90)).toBe("amarillo");
  });

  it("rojo cuando está más de 10% por debajo de la meta", () => {
    expect(calcularSemaforo(50, 90)).toBe("rojo");
  });
});
