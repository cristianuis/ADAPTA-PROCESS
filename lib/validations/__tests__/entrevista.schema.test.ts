import { describe, expect, it } from "vitest";
import {
  hallazgoIASchema,
  invitacionAutoservicioSchema,
  respuestaAutoservicioSchema,
} from "@/lib/validations/entrevista.schema";
import { SYSTEM_PROMPT as PROMPT_ANALIZAR_ENTREVISTA } from "@/app/api/ia/analizar-entrevista/route";

// Auditoría 2.1: cita_soporte vacía o casi vacía es la causa más probable de
// hallazgos genéricos generados por IA — este test bloquea una regresión.

const base = {
  titulo: "Falta claridad en autorización de descuentos",
  descripcion: "Nadie sabe quién autoriza descuentos urgentes.",
  categoria: "gobierno" as const,
  impacto_estimado: 4,
  esfuerzo_estimado: 2,
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

describe("hallazgoIASchema — esfuerzo_estimado (Bloque 0.1: ya no un default fijo en 3)", () => {
  it("acepta un hallazgo con esfuerzo_estimado real", () => {
    expect(hallazgoIASchema.safeParse({ ...base, esfuerzo_estimado: 5 }).success).toBe(true);
  });

  it("rechaza un hallazgo sin el campo esfuerzo_estimado (antes no existía y el default vivía en la UI)", () => {
    const sinEsfuerzo: Record<string, unknown> = { ...base };
    delete sinEsfuerzo.esfuerzo_estimado;
    expect(hallazgoIASchema.safeParse(sinEsfuerzo).success).toBe(false);
  });

  it("rechaza esfuerzo_estimado fuera de rango 1-5", () => {
    expect(hallazgoIASchema.safeParse({ ...base, esfuerzo_estimado: 0 }).success).toBe(false);
    expect(hallazgoIASchema.safeParse({ ...base, esfuerzo_estimado: 6 }).success).toBe(false);
  });
});

describe("invitacionAutoservicioSchema (Bloque 3: intake de autoservicio)", () => {
  it("acepta una invitación sin nombre/cargo (enlace genérico)", () => {
    const r = invitacionAutoservicioSchema.safeParse({ proyectoId: "11111111-1111-1111-1111-111111111111" });
    expect(r.success).toBe(true);
  });

  it("acepta una invitación con nombre y cargo precargados", () => {
    const r = invitacionAutoservicioSchema.safeParse({
      proyectoId: "11111111-1111-1111-1111-111111111111",
      entrevistadoNombre: "Ana Torres",
      entrevistadoCargo: "Analista de compras",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza un proyectoId que no sea uuid", () => {
    const r = invitacionAutoservicioSchema.safeParse({ proyectoId: "no-es-uuid" });
    expect(r.success).toBe(false);
  });
});

describe("respuestaAutoservicioSchema (Bloque 3: intake de autoservicio)", () => {
  const baseRespuesta = {
    token: "22222222-2222-2222-2222-222222222222",
    entrevistadoNombre: "Ana Torres",
    entrevistadoCargo: "Analista de compras",
    queRecibes: "Recibo la solicitud de compra del área comercial.",
    queHaces: "Reviso el presupuesto y aprueba o rechaza según el monto.",
    queEntregas: "Entrego la orden de compra aprobada a logística.",
    queTeQuitaTiempo: "Perseguir aprobaciones que se quedan atascadas por correo.",
  };

  it("acepta una respuesta completa", () => {
    expect(respuestaAutoservicioSchema.safeParse(baseRespuesta).success).toBe(true);
  });

  it("rechaza si falta el nombre", () => {
    expect(respuestaAutoservicioSchema.safeParse({ ...baseRespuesta, entrevistadoNombre: "" }).success).toBe(false);
  });

  it("rechaza respuestas demasiado cortas para ser una descripción real (ej. 'N/A')", () => {
    expect(respuestaAutoservicioSchema.safeParse({ ...baseRespuesta, queHaces: "N/A" }).success).toBe(false);
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

  it("Bloque 0.1 — exige esfuerzo_estimado con criterio de evidencia, no un valor por defecto", () => {
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/esfuerzo_estimado/);
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/valor por defecto/);
  });

  it("prohíbe explícitamente vocabulario genérico como 'madurez baja' o 'problemas de comunicación' sin anclaje", () => {
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/madurez baja/);
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/problemas de comunicación/);
    // Y exige el anclaje a datos reales, no solo prohíbe el término suelto.
    expect(PROMPT_ANALIZAR_ENTREVISTA).toMatch(/cita_soporte/);
  });
});
