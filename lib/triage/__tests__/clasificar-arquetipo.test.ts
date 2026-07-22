import { describe, expect, it } from "vitest";
import { clasificarArquetipo, type TriageInput } from "@/lib/triage/clasificar-arquetipo";

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

  it("puntaje <= 2 sin disparadores especiales → Arquetipo A", () => {
    const r = clasificarArquetipo({ ...base, p1: 0, p2: 1, p3: 0, p4: 0, p6: 1, p5: "problema" });
    expect(r.puntaje).toBe(2);
    expect(r.arquetipo).toBe("A");
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
