import { describe, expect, it } from "vitest";
import { hallazgoIASchema } from "@/lib/validations/entrevista.schema";

// Auditoría 2.1: cita_soporte vacía o casi vacía es la causa más probable de
// hallazgos genéricos generados por IA — este test bloquea una regresión.

const base = {
  titulo: "Falta claridad en autorización de descuentos",
  descripcion: "Nadie sabe quién autoriza descuentos urgentes.",
  categoria: "gobierno" as const,
  impacto_estimado: 4,
  cita_soporte: "el gerente dice una cosa y el jefe de ventas otra",
  confianza: "alta" as const,
};

describe("hallazgoIASchema — cita_soporte obligatoria con contenido real", () => {
  it("acepta un hallazgo con cita_soporte real", () => {
    expect(hallazgoIASchema.safeParse(base).success).toBe(true);
  });

  it("rechaza cita_soporte vacía", () => {
    expect(hallazgoIASchema.safeParse({ ...base, cita_soporte: "" }).success).toBe(false);
  });

  it("rechaza cita_soporte demasiado corta para ser una cita real (ej. 'N/A')", () => {
    expect(hallazgoIASchema.safeParse({ ...base, cita_soporte: "N/A" }).success).toBe(false);
  });
});
