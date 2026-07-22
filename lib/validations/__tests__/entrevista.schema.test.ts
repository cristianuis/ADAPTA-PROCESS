import { describe, expect, it } from "vitest";
import { hallazgoIASchema } from "@/lib/validations/entrevista.schema";
import { SYSTEM_PROMPT as PROMPT_ANALIZAR_ENTREVISTA } from "@/app/api/ia/analizar-entrevista/route";

// Auditoría 2.1: cita_soporte vacía o casi vacía es la causa más probable de
// hallazgos genéricos generados por IA — este test bloquea una regresión.

const base = {
  titulo: "Falta claridad en autorización de descuentos",
  descripcion: "Nadie sabe quién autoriza descuentos urgentes.",
  categoria: "gobierno" as const,
  impacto_estimado: 4,
  cita_soporte: "el gerente dice una cosa y el jefe de ventas otra",
  confianza: "alta" as const,
  habilitador_pemm: null,
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

describe("hallazgoIASchema — habilitador_pemm (Bloque 1.1: vocabulario técnico estructurado)", () => {
  it("acepta un habilitador_pemm válido para un hallazgo de categoría proceso", () => {
    const r = hallazgoIASchema.safeParse({ ...base, categoria: "proceso", habilitador_pemm: "diseno" });
    expect(r.success).toBe(true);
  });

  it("acepta habilitador_pemm null cuando la categoría no es proceso", () => {
    const r = hallazgoIASchema.safeParse({ ...base, categoria: "gobierno", habilitador_pemm: null });
    expect(r.success).toBe(true);
  });

  it("rechaza un habilitador_pemm con vocabulario genérico fuera de los 5 habilitadores de Hammer (ej. 'madurez_baja')", () => {
    const r = hallazgoIASchema.safeParse({ ...base, categoria: "proceso", habilitador_pemm: "madurez_baja" });
    expect(r.success).toBe(false);
  });

  it("rechaza un hallazgo sin el campo habilitador_pemm (ya no basta con la forma antigua del JSON)", () => {
    const sinHabilitador: Record<string, unknown> = { ...base };
    delete sinHabilitador.habilitador_pemm;
    const r = hallazgoIASchema.safeParse(sinHabilitador);
    expect(r.success).toBe(false);
  });
});

describe("SYSTEM_PROMPT de analizar-entrevista — exige vocabulario técnico ADAPTA/PEMM, no genérico", () => {
  it("menciona el modelo PEMM y a Hammer explícitamente", () => {
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/PEMM/);
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/Hammer/);
  });

  it("nombra los 5 habilitadores exactos del modelo (no una lista distinta o incompleta)", () => {
    for (const habilitador of ["diseño", "ejecutores", "responsable", "infraestructura", "indicadores"]) {
      expect(PROMPT_ANALIZAR_ENTREVISTA.toLowerCase()).toContain(habilitador);
    }
  });

  it("prohíbe explícitamente vocabulario genérico como 'madurez baja' o 'problemas de comunicación' sin anclaje", () => {
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/madurez baja/);
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/problemas de comunicación/);
    // Y exige el anclaje a datos reales, no solo prohíbe el término suelto.
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/cita_soporte/);
  });
});
