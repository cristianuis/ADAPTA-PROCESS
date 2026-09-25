import { describe, expect, it } from "vitest";
import { filtrarHallazgosCitados } from "@/lib/entrevistas/filtrar-hallazgos-citados";
import type { AnalisisEntrevista } from "@/lib/validations/entrevista.schema";

const base: AnalisisEntrevista = {
  hallazgos: [
    {
      titulo: "Espera por autorización",
      descripcion: "La orden espera la firma del jefe.",
      categoria: "proceso",
      impacto_estimado: 3,
      esfuerzo_estimado: 2,
      cita_soporte: "esperamos la firma del jefe",
      confianza: "alta",
      habilitador_pemm: "diseno",
    },
    {
      titulo: "Dato inventado",
      descripcion: "No está en la fuente.",
      categoria: "datos",
      impacto_estimado: 2,
      esfuerzo_estimado: 1,
      cita_soporte: "Se pierden todos los pedidos de cada mes",
      confianza: "baja",
      habilitador_pemm: null,
    },
  ],
  procesos_mencionados: ["Pedidos"],
  nivel_resistencia: "bajo",
  senales_gobierno: [],
};

describe("filtrarHallazgosCitados", () => {
  it("descarta una conclusión cuya cita no aparece en la entrevista", () => {
    const resultado = filtrarHallazgosCitados(base, "En pedidos esperamos la firma del jefe cada mañana.");
    expect(resultado.descartados).toBe(1);
    expect(resultado.analisis.hallazgos.map((h) => h.titulo)).toEqual(["Espera por autorización"]);
  });

  it("no convierte una cita en aprobación del consultor", () => {
    const resultado = filtrarHallazgosCitados(base, "esperamos la firma del jefe");
    expect(resultado.analisis.hallazgos[0].confianza).toBe("alta");
    expect(resultado.analisis).not.toHaveProperty("estado_evidencia");
  });
});
