import { describe, expect, it } from "vitest";
import { indicadorSchema } from "@/lib/validations/indicador.schema";

// Regla no negociable del método (blueprint Módulo 6.5): un indicador sin fuente_datos
// ni mecanismo_captura no se puede guardar. Esta es la capa que efectivamente lo impide
// antes de que el dato llegue a Supabase — si estos tests fallan, la regla dejó de aplicarse.

const base = {
  procesoId: "00000000-0000-0000-0000-000000000001",
  nombre: "% pedidos a tiempo",
  tipo: "eficacia" as const,
  fuenteDatos: "Sistema de despachos",
  mecanismoCaptura: "Reporte automático mensual",
};

describe("indicadorSchema — fuente_datos y mecanismo_captura obligatorios", () => {
  it("acepta un indicador con fuente_datos y mecanismo_captura presentes", () => {
    const result = indicadorSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rechaza un indicador sin fuente_datos", () => {
    const result = indicadorSchema.safeParse({ ...base, fuenteDatos: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza un indicador con fuente_datos ausente del payload", () => {
    const { fuenteDatos, ...sinFuente } = base;
    void fuenteDatos;
    const result = indicadorSchema.safeParse(sinFuente);
    expect(result.success).toBe(false);
  });

  it("rechaza un indicador sin mecanismo_captura", () => {
    const result = indicadorSchema.safeParse({ ...base, mecanismoCaptura: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza fuente_datos de un solo carácter (no es una fuente real)", () => {
    const result = indicadorSchema.safeParse({ ...base, fuenteDatos: "x" });
    expect(result.success).toBe(false);
  });

  it("rechaza un tipo de indicador fuera de eficacia/eficiencia/calidad", () => {
    const result = indicadorSchema.safeParse({ ...base, tipo: "otro" });
    expect(result.success).toBe(false);
  });
});
