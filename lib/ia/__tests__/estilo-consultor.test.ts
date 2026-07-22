import { describe, expect, it } from "vitest";
import { construirBloqueEstiloConsultor } from "@/lib/ia/estilo-consultor";

describe("construirBloqueEstiloConsultor", () => {
  it("retorna null si no hay ejemplos de estilo (comportamiento inactivo por defecto)", () => {
    expect(construirBloqueEstiloConsultor(null)).toBeNull();
    expect(construirBloqueEstiloConsultor(undefined)).toBeNull();
    expect(construirBloqueEstiloConsultor("")).toBeNull();
    expect(construirBloqueEstiloConsultor("   ")).toBeNull();
  });

  it("retorna un bloque de contexto cuando hay contenido real", () => {
    const bloque = construirBloqueEstiloConsultor("Mi forma de escribir es directa y sin adornos.");
    expect(bloque).not.toBeNull();
    expect(bloque).toContain("Mi forma de escribir es directa y sin adornos.");
  });
});
