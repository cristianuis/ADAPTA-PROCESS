import { describe, expect, it } from "vitest";
import { calcularNivelResultante } from "@/lib/pemm/calcular-nivel";

describe("calcularNivelResultante", () => {
  it("toma el mínimo de los 5 habilitadores de proceso, no el promedio", () => {
    const nivel = calcularNivelResultante("proceso", {
      diseno: 4,
      ejecutores: 4,
      responsable: 1,
      infraestructura: 4,
      indicadores: 4,
    });
    expect(nivel).toBe(1);
  });

  it("toma el mínimo de las 4 capacidades de empresa", () => {
    const nivel = calcularNivelResultante("empresa", {
      liderazgo: 3,
      cultura: 2,
      experiencia: 4,
      gobierno: 3,
    });
    expect(nivel).toBe(2);
  });

  it("devuelve null si falta alguna dimensión requerida", () => {
    const nivel = calcularNivelResultante("proceso", {
      diseno: 3,
      ejecutores: 3,
      responsable: 3,
      infraestructura: 3,
      // indicadores ausente
    });
    expect(nivel).toBeNull();
  });

  it("todas las dimensiones en el nivel máximo da nivel 4", () => {
    const nivel = calcularNivelResultante("proceso", {
      diseno: 4,
      ejecutores: 4,
      responsable: 4,
      infraestructura: 4,
      indicadores: 4,
    });
    expect(nivel).toBe(4);
  });
});
