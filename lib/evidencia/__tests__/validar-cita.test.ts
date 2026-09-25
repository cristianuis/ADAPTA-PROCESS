import { describe, expect, it } from "vitest";
import { citaExisteEnFuente } from "@/lib/evidencia/validar-cita";

describe("citaExisteEnFuente", () => {
  it("acepta una cita literal aunque varíen mayúsculas, tildes y espacios", () => {
    expect(citaExisteEnFuente(
      "El área comercial registra las solicitudes en una hoja de cálculo.",
      "el area comercial registra las   solicitudes",
    )).toBe(true);
  });

  it("rechaza una cita inventada o ausente", () => {
    expect(citaExisteEnFuente("El equipo usa una hoja de cálculo.", "No existe seguimiento estructurado a cotizaciones.")).toBe(false);
  });

  it("rechaza fuente vacía o citas demasiado cortas", () => {
    expect(citaExisteEnFuente(null, "Una cita suficientemente larga")).toBe(false);
    expect(citaExisteEnFuente("Una fuente con suficiente contenido", "N/A")).toBe(false);
  });
});
