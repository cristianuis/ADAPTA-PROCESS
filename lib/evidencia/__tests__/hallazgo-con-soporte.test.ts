import { describe, expect, it } from "vitest";
import { hallazgoConSoporteRevisado } from "../hallazgo-con-soporte";

describe("soporte mínimo de un hallazgo en el Informe 360", () => {
  const base = { estado_evidencia: "validado_consultor", cita_soporte: "Registro observado en turno nocturno", fuente: "observacion", fuente_id: null };

  it("no cuenta un estado revisado sin referencia textual", () => {
    expect(hallazgoConSoporteRevisado({ ...base, cita_soporte: null })).toBe(false);
    expect(hallazgoConSoporteRevisado({ ...base, cita_soporte: "breve" })).toBe(false);
  });

  it("requiere origen identificable para una cita cotejada", () => {
    expect(hallazgoConSoporteRevisado({ ...base, estado_evidencia: "cita_verificada", fuente: "entrevista", fuente_id: null })).toBe(false);
    expect(hallazgoConSoporteRevisado({ ...base, estado_evidencia: "cita_verificada", fuente: "entrevista", fuente_id: "22222222-2222-4222-8222-222222222222" })).toBe(true);
  });

  it("permite una referencia manual revisada, sin llamarla cita cotejada", () => {
    expect(hallazgoConSoporteRevisado(base)).toBe(true);
    expect(hallazgoConSoporteRevisado({ ...base, estado_evidencia: "pendiente_validacion" })).toBe(false);
  });
});
