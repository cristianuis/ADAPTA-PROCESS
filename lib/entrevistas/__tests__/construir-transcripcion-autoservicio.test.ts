import { describe, expect, it } from "vitest";
import { construirTranscripcionAutoservicio } from "@/lib/entrevistas/construir-transcripcion-autoservicio";

describe("construirTranscripcionAutoservicio", () => {
  const respuestas = {
    queRecibes: "Recibo la solicitud de compra del área comercial.",
    queHaces: "Reviso el presupuesto y aprueba o rechaza según el monto.",
    queEntregas: "Entrego la orden de compra aprobada a logística.",
    queTeQuitaTiempo: "Perseguir aprobaciones que se quedan atascadas por correo.",
  };

  it("incluye las 4 respuestas en el texto compuesto", () => {
    const texto = construirTranscripcionAutoservicio(respuestas);
    expect(texto).toContain(respuestas.queRecibes);
    expect(texto).toContain(respuestas.queHaces);
    expect(texto).toContain(respuestas.queEntregas);
    expect(texto).toContain(respuestas.queTeQuitaTiempo);
  });

  it("marca el texto como intake de autoservicio para diferenciarlo de una entrevista dirigida", () => {
    const texto = construirTranscripcionAutoservicio(respuestas);
    expect(texto).toMatch(/autoservicio/i);
  });
});
