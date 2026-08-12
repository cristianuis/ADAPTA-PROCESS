import { describe, expect, it } from "vitest";
import { calcularAvanceBeneficio, calcularCasoNegocio, calcularImpactoAnual } from "../calcular-impacto";

describe("cálculos del caso de impacto", () => {
  it("anualiza el impacto y aplica el porcentaje capturable", () => {
    expect(calcularImpactoAnual({
      valorUnitario: 50_000,
      volumenPeriodo: 10,
      periodosAnio: 12,
      porcentajeCapturable: 75,
    })).toBe(4_500_000);
  });

  it("calcula ROI y payback sin dividir por cero", () => {
    expect(calcularCasoNegocio(10_000_000, 30_000_000)).toEqual({ roi: 200, paybackMeses: 4 });
    expect(calcularCasoNegocio(0, 0)).toEqual({ roi: null, paybackMeses: null });
  });

  it("mide avance frente al beneficio objetivo", () => {
    expect(calcularAvanceBeneficio(12, 20)).toBe(60);
    expect(calcularAvanceBeneficio(12, 0)).toBe(0);
  });
});
