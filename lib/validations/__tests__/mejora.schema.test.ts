import { describe, expect, it } from "vitest";
import { cuantificacionImpactoSchema, iniciativaMejoraSchema } from "../mejora.schema";

const uuidA = "00000000-0000-4000-8000-000000000001";
const uuidB = "00000000-0000-4000-8000-000000000002";

describe("validaciones del plan de mejora", () => {
  it("rechaza cuantificaciones sin fuente ni supuestos", () => {
    const resultado = cuantificacionImpactoSchema.safeParse({
      proyectoId: uuidA,
      hallazgoId: uuidB,
      nombre: "Errores de despacho",
      tipo: "ahorro",
      valorUnitario: 10,
      volumenPeriodo: 3,
      periodosAnio: 12,
      porcentajeCapturable: 70,
      moneda: "COP",
      fuenteCalculo: "",
      supuestos: "",
      confianza: "media",
      validadoCliente: false,
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza iniciativas sin hallazgos o con fechas invertidas", () => {
    const resultado = iniciativaMejoraSchema.safeParse({
      proyectoId: uuidA,
      hallazgoIds: [],
      titulo: "Reducir errores",
      descripcion: "",
      hipotesis: "Estandarizar reducirá la variación operativa.",
      resultadoEsperado: "Menos reclamos",
      criterioExito: "Bajar errores al 1%",
      prioridad: 1,
      responsable: "Operaciones",
      fechaInicio: "2026-09-10",
      fechaObjetivo: "2026-09-01",
      inversionEstimada: 0,
      beneficioAnualObjetivo: 100,
      moneda: "COP",
    });
    expect(resultado.success).toBe(false);
  });
});
