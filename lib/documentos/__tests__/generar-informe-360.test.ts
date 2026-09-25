import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { generarInforme360 } from "../generar-informe-360";
import type { DatosInforme360 } from "../datos-informe-360";

describe("Informe 360", () => {
  it("produce un DOCX aun cuando secciones opcionales no tienen mediciones", async () => {
    const datos = {
      consultor: { nombre: "Consultor" },
      cliente: { razon_social: "Empresa Prueba" },
      proyecto: { nombre: "Intervención de prueba" },
      triage: null,
      entrevistas: [{ entrevistado_cargo: "Operaciones", fecha: "2026-09-25", estado: "analizada" }],
      evaluacionesPemm: [],
      hallazgos: [],
      procesos: [], actividades: [], sipoc: [], indicadores: [], disenos: [], pasos: [],
      iniciativas: [], acciones: [], enlaces: [], mediciones: [],
      cobertura: {
        entrevistas: 1, evaluacionesPemmRespondidas: 0, hallazgosRevisados: 0,
        procesosConActividades: 0, disenosTobeValidados: 0, indicadores: 0, iniciativasConAcciones: 0,
      },
    } as unknown as DatosInforme360;
    const buffer = await Packer.toBuffer(generarInforme360(datos, "Síntesis revisada por el consultor con límites explícitos."));
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
    expect(buffer.length).toBeGreaterThan(2000);
  });
});
