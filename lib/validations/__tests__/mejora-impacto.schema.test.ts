import { describe, expect, it } from "vitest";
import { medicionImpactoSchema } from "../mejora.schema";

const medicionBase = {
  proyectoId: "00000000-0000-4000-8000-000000000001",
  iniciativaId: "00000000-0000-4000-8000-000000000002",
  tipo: "seguimiento" as const,
  fecha: "2026-09-24",
  beneficioAnualRealizado: 12000,
  costoAcumulado: 0,
  valorIndicador: null,
  unidadIndicador: "",
  fuenteDatos: "Muestra de facturas",
  observaciones: "",
  validadoCliente: false,
};

describe("medicionImpactoSchema", () => {
  it("acepta resultados negativos para reflejar un deterioro", () => {
    expect(medicionImpactoSchema.safeParse({ ...medicionBase, beneficioAnualRealizado: -12000 }).success).toBe(true);
  });

  it("rechaza costos acumulados negativos", () => {
    expect(medicionImpactoSchema.safeParse({ ...medicionBase, costoAcumulado: -1 }).success).toBe(false);
  });

  it("exige que un valor cero se proporcione explícitamente", () => {
    const sinBeneficio = { ...medicionBase };
    Reflect.deleteProperty(sinBeneficio, "beneficioAnualRealizado");
    expect(medicionImpactoSchema.safeParse(sinBeneficio).success).toBe(false);
  });
});
