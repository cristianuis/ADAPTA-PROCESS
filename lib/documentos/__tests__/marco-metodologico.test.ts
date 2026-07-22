import { describe, expect, it } from "vitest";
import { determinarMarcoMetodologico, type SenalesMarcoMetodologico } from "@/lib/documentos/marco-metodologico";

const sinSenales: SenalesMarcoMetodologico = {
  tienePemm: false,
  tieneSipoc: false,
  tieneProcesosClasificados: false,
  tieneIndicadores: false,
  tieneHallazgoAltoImpactoProceso: false,
  tieneResistenciaCambio: false,
};

describe("determinarMarcoMetodologico", () => {
  it("sin ninguna señal → lista vacía (nunca una lista fija por defecto)", () => {
    expect(determinarMarcoMetodologico(sinSenales)).toEqual([]);
  });

  it("tienePemm → incluye Hammer/PEMM y solo esa", () => {
    const r = determinarMarcoMetodologico({ ...sinSenales, tienePemm: true });
    expect(r).toHaveLength(1);
    expect(r[0].framework).toContain("Hammer");
  });

  it("tieneSipoc → incluye ISO 9001:2015", () => {
    const r = determinarMarcoMetodologico({ ...sinSenales, tieneSipoc: true });
    expect(r.some((x) => x.framework.includes("ISO 9001"))).toBe(true);
  });

  it("tieneProcesosClasificados → incluye APQC PCF", () => {
    const r = determinarMarcoMetodologico({ ...sinSenales, tieneProcesosClasificados: true });
    expect(r.some((x) => x.framework.includes("APQC"))).toBe(true);
  });

  it("tieneIndicadores → incluye Kaplan & Norton", () => {
    const r = determinarMarcoMetodologico({ ...sinSenales, tieneIndicadores: true });
    expect(r.some((x) => x.framework.includes("Kaplan"))).toBe(true);
  });

  it("tieneHallazgoAltoImpactoProceso → incluye Goldratt", () => {
    const r = determinarMarcoMetodologico({ ...sinSenales, tieneHallazgoAltoImpactoProceso: true });
    expect(r.some((x) => x.framework.includes("Goldratt"))).toBe(true);
  });

  it("tieneResistenciaCambio → incluye ADKAR/Hiatt", () => {
    const r = determinarMarcoMetodologico({ ...sinSenales, tieneResistenciaCambio: true });
    expect(r.some((x) => x.framework.includes("ADKAR"))).toBe(true);
  });

  it("todas las señales activas → incluye las 6 referencias, ninguna repetida", () => {
    const todas: SenalesMarcoMetodologico = {
      tienePemm: true,
      tieneSipoc: true,
      tieneProcesosClasificados: true,
      tieneIndicadores: true,
      tieneHallazgoAltoImpactoProceso: true,
      tieneResistenciaCambio: true,
    };
    const r = determinarMarcoMetodologico(todas);
    expect(r).toHaveLength(6);
    expect(new Set(r.map((x) => x.framework)).size).toBe(6);
  });
});
