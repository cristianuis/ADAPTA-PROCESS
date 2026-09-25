import { describe, expect, it } from "vitest";
import { esRutaPublica } from "../rutas-publicas";

describe("rutas públicas", () => {
  it.each(["/", "/login", "/diagnostico", "/encuesta/pemm/token", "/encuesta/proceso/token"])("permite %s", (ruta) => {
    expect(esRutaPublica(ruta)).toBe(true);
  });

  it.each(["/proyectos", "/login-interno", "/encuesta-privada", "/consultoria-admin", "/diagnostico-empresa"])("no abre %s por prefijo", (ruta) => {
    expect(esRutaPublica(ruta)).toBe(false);
  });
});
