import { describe, expect, it } from "vitest";
import {
  clasificarArquetipo,
  esEmpresaJovenPequena,
  EMPRESA_PEQUENA_EMPLEADOS_MAX,
  EMPRESA_PEQUENA_FACTURACION_MAX,
  type TriageInput,
} from "@/lib/triage/clasificar-arquetipo";

const base: TriageInput = { p1: 0, p2: 0, p3: 0, p4: 0, p5: "crecimiento", p6: 0 };

describe("clasificarArquetipo", () => {
  it("requisito_externo domina sobre cualquier otra respuesta → Arquetipo E", () => {
    const r = clasificarArquetipo({ ...base, p1: 2, p2: 2, p3: 2, p4: 2, p6: 2, p5: "requisito_externo" });
    expect(r.arquetipo).toBe("E");
  });

  it("documentación existe pero no se usa (p1=2, p2=0) → Arquetipo C, aunque el puntaje sea bajo", () => {
    const r = clasificarArquetipo({ ...base, p1: 2, p2: 0, p5: "problema" });
    expect(r.arquetipo).toBe("C");
  });

  it("puntaje <= 2 sin perfil de empresa cargado (comportamiento histórico) → Arquetipo A", () => {
    const r = clasificarArquetipo({ ...base, p1: 0, p2: 1, p3: 0, p4: 0, p6: 1, p5: "problema" });
    expect(r.puntaje).toBe(2);
    expect(r.arquetipo).toBe("A");
  });

  it("puntaje <= 2 + empresa joven/pequeña (empleados y facturación bajos) → Arquetipo A", () => {
    const r = clasificarArquetipo(
      { ...base, p1: 0, p2: 1, p3: 0, p4: 0, p6: 1, p5: "problema" },
      { numEmpleados: 5, facturacionAnual: 50_000_000 }
    );
    expect(r.puntaje).toBe(2);
    expect(r.arquetipo).toBe("A");
  });

  it("caso Alfanova: puntaje bajo pero empresa establecida (34 empleados, $4.200M) + disparador 'problema' → Arquetipo B, no A", () => {
    const r = clasificarArquetipo(
      { p1: 1, p2: 0, p3: 0, p4: 1, p5: "problema", p6: 0 },
      { numEmpleados: 34, facturacionAnual: 4_200_000_000 }
    );
    expect(r.puntaje).toBe(2);
    expect(r.arquetipo).toBe("B");
    expect(r.alertaGobierno).toBe(true);
  });

  it("puntaje <= 2 + empresa establecida + disparador 'crecimiento' → Arquetipo B", () => {
    const r = clasificarArquetipo(
      { ...base, p1: 0, p2: 1, p3: 0, p4: 0, p6: 1, p5: "crecimiento" },
      { numEmpleados: 100, facturacionAnual: 10_000_000_000 }
    );
    expect(r.puntaje).toBe(2);
    expect(r.arquetipo).toBe("B");
  });

  it("requisito_externo sigue dominando aunque la empresa no sea joven/pequeña (no debe verse afectado por el fix)", () => {
    const r = clasificarArquetipo(
      { ...base, p1: 0, p2: 1, p3: 0, p4: 0, p6: 1, p5: "requisito_externo" },
      { numEmpleados: 500, facturacionAnual: 50_000_000_000 }
    );
    expect(r.arquetipo).toBe("E");
  });

  it("puntaje entre 3 y 4 con disparador crecimiento → Arquetipo B", () => {
    const r = clasificarArquetipo({ ...base, p1: 1, p2: 1, p3: 0, p4: 0, p6: 1, p5: "crecimiento" });
    expect(r.puntaje).toBe(3);
    expect(r.arquetipo).toBe("B");
  });

  it("puntaje 5 sin disparador crecimiento → Arquetipo B", () => {
    const r = clasificarArquetipo({ ...base, p1: 1, p2: 1, p3: 1, p4: 1, p6: 1, p5: "problema" });
    expect(r.puntaje).toBe(5);
    expect(r.arquetipo).toBe("B");
  });

  it("puntaje >= 6 → Arquetipo D", () => {
    const r = clasificarArquetipo({ ...base, p1: 2, p2: 2, p3: 2, p4: 2, p6: 2, p5: "problema" });
    expect(r.puntaje).toBe(10);
    expect(r.arquetipo).toBe("D");
  });

  it("p6 = 0 activa alerta de gobierno sin importar el resto", () => {
    const r = clasificarArquetipo({ ...base, p6: 0 });
    expect(r.alertaGobierno).toBe(true);
  });

  it("p6 > 0 no activa alerta de gobierno", () => {
    const r = clasificarArquetipo({ ...base, p6: 1 });
    expect(r.alertaGobierno).toBe(false);
  });
});

describe("esEmpresaJovenPequena", () => {
  it("sin perfil → true (comportamiento histórico, evita romper triages sin datos de cliente)", () => {
    expect(esEmpresaJovenPequena(undefined)).toBe(true);
  });

  it("perfil sin numEmpleados ni facturacionAnual → true", () => {
    expect(esEmpresaJovenPequena({})).toBe(true);
  });

  it(`numEmpleados en el umbral (${EMPRESA_PEQUENA_EMPLEADOS_MAX}) → true`, () => {
    expect(esEmpresaJovenPequena({ numEmpleados: EMPRESA_PEQUENA_EMPLEADOS_MAX })).toBe(true);
  });

  it(`numEmpleados por encima del umbral (${EMPRESA_PEQUENA_EMPLEADOS_MAX + 1}) sin facturación → false`, () => {
    expect(esEmpresaJovenPequena({ numEmpleados: EMPRESA_PEQUENA_EMPLEADOS_MAX + 1 })).toBe(false);
  });

  it(`facturacionAnual en el umbral (${EMPRESA_PEQUENA_FACTURACION_MAX}) → true`, () => {
    expect(esEmpresaJovenPequena({ facturacionAnual: EMPRESA_PEQUENA_FACTURACION_MAX })).toBe(true);
  });

  it("Alfanova (34 empleados, $4.200M) supera ambos umbrales → false", () => {
    expect(esEmpresaJovenPequena({ numEmpleados: 34, facturacionAnual: 4_200_000_000 })).toBe(false);
  });
});
