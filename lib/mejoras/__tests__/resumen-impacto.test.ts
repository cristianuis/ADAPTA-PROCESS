import { describe, expect, it } from "vitest";
import { prepararSeriesImpacto, ultimaMedicionAnualValidada } from "../resumen-impacto";
import type { Database } from "@/lib/supabase/types";

type Iniciativa = Database["public"]["Tables"]["iniciativas_mejora"]["Row"];
type Medicion = Database["public"]["Tables"]["mediciones_impacto"]["Row"];

const iniciativa = (overrides: Partial<Iniciativa> = {}): Iniciativa => ({
  id: "00000000-0000-4000-8000-000000000001",
  proyecto_id: "00000000-0000-4000-8000-000000000002",
  titulo: "Reducir reproceso",
  descripcion: null,
  hipotesis: "La revisión temprana reducirá el reproceso observado.",
  resultado_esperado: "Menos devoluciones",
  criterio_exito: "Menos de 5 devoluciones",
  estado: "en_ejecucion",
  prioridad: 1,
  responsable: null,
  fecha_inicio: null,
  fecha_objetivo: null,
  inversion_estimada: 0,
  beneficio_anual_objetivo: 120000,
  roi_estimado: null,
  payback_meses: null,
  moneda: "COP",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const medicion = (overrides: Partial<Medicion> = {}): Medicion => ({
  id: "00000000-0000-4000-8000-000000000003",
  iniciativa_id: "00000000-0000-4000-8000-000000000001",
  tipo: "seguimiento",
  fecha: "2026-02-01",
  beneficio_anual_realizado: 45000,
  costo_acumulado: 0,
  valor_indicador: null,
  unidad_indicador: null,
  fuente_datos: "Muestra de facturas",
  observaciones: null,
  validado_cliente: true,
  created_at: "2026-02-01T00:00:00.000Z",
  ...overrides,
});

describe("resumen de impacto", () => {
  it("no cuenta una línea base ni una medición sin validación como beneficio anual verificado", () => {
    expect(ultimaMedicionAnualValidada([
      medicion({ tipo: "linea_base", fecha: "2026-03-01" }),
      medicion({ id: "00000000-0000-4000-8000-000000000004", validado_cliente: false, fecha: "2026-02-20" }),
    ])).toBeNull();
  });

  it("toma el seguimiento validado más reciente por fecha y registro", () => {
    const ultima = ultimaMedicionAnualValidada([
      medicion({ fecha: "2026-02-01" }),
      medicion({ id: "00000000-0000-4000-8000-000000000004", fecha: "2026-03-01", beneficio_anual_realizado: 70000 }),
      medicion({ id: "00000000-0000-4000-8000-000000000005", fecha: "2026-04-01", validado_cliente: false, beneficio_anual_realizado: 99000 }),
    ]);
    expect(ultima?.beneficio_anual_realizado).toBe(70000);
  });

  it("separa monedas y excluye borradores y descartadas de la comparación", () => {
    const series = prepararSeriesImpacto([
      iniciativa(),
      iniciativa({ id: "00000000-0000-4000-8000-000000000006", moneda: "USD", titulo: "Caso en dólares" }),
      iniciativa({ id: "00000000-0000-4000-8000-000000000007", estado: "borrador" }),
      iniciativa({ id: "00000000-0000-4000-8000-000000000008", estado: "descartada" }),
    ], [medicion()]);

    expect(series.map((grupo) => grupo.moneda).sort()).toEqual(["COP", "USD"]);
    expect(series.find((grupo) => grupo.moneda === "COP")?.datos).toHaveLength(1);
    expect(series.find((grupo) => grupo.moneda === "USD")?.datos[0]?.realizado).toBeNull();
  });
});
