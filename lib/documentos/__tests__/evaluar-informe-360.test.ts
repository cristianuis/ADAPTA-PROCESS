import { describe, expect, it } from "vitest";
import { evaluarPreparacionInforme360 } from "../evaluar-informe-360";

describe("preparación del Informe 360", () => {
  it("no permite llamar final a un diagnóstico sin TO-BE validado", () => {
    const resultado = evaluarPreparacionInforme360({
      entrevistas: 1, evaluacionesPemmRespondidas: 1, hallazgosRevisados: 2,
      procesosConActividades: 1, disenosTobeValidados: 0, indicadores: 1, iniciativasConAcciones: 1,
    });
    expect(resultado.listo).toBe(false);
    expect(resultado.faltantes.map((item) => item.clave)).toEqual(["disenosTobeValidados"]);
  });

  it("acepta una intervención con todas las piezas mínimas", () => {
    expect(evaluarPreparacionInforme360({
      entrevistas: 1, evaluacionesPemmRespondidas: 1, hallazgosRevisados: 1,
      procesosConActividades: 1, disenosTobeValidados: 1, indicadores: 1, iniciativasConAcciones: 1,
    }).listo).toBe(true);
  });
});
