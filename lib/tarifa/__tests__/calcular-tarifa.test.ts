import { describe, expect, it } from "vitest";
import { calcularTarifaHora, cotizarPorArquetipo } from "@/lib/tarifa/calcular-tarifa";

describe("calcularTarifaHora", () => {
  it("aplica 55% de horas facturables por defecto", () => {
    const r = calcularTarifaHora({ costoMensualTotal: 8000000, utilidadDeseadaMensual: 2000000, horasTotalesMes: 160 });
    expect(r.horasFacturables).toBe(88);
    expect(r.tarifaHoraObjetivo).toBe(Math.round(10000000 / 88));
  });

  it("permite sobreescribir el porcentaje facturable", () => {
    const r = calcularTarifaHora({
      costoMensualTotal: 5000000,
      utilidadDeseadaMensual: 1000000,
      horasTotalesMes: 160,
      porcentajeFacturable: 0.7,
    });
    expect(r.horasFacturables).toBe(112);
  });
});

describe("cotizarPorArquetipo", () => {
  it("arquetipo D (transformación profunda) cotiza más horas que arquetipo A", () => {
    const a = cotizarPorArquetipo({ arquetipo: "A", tamano: "mediana", tarifaHora: 100000 });
    const d = cotizarPorArquetipo({ arquetipo: "D", tamano: "mediana", tarifaHora: 100000 });
    expect(d.horasEstimadas).toBeGreaterThan(a.horasEstimadas);
  });

  it("devuelve un rango, no una cifra única", () => {
    const r = cotizarPorArquetipo({ arquetipo: "B", tamano: "mediana", tarifaHora: 100000 });
    expect(r.rangoMaximo).toBeGreaterThan(r.rangoMinimo);
  });

  it("empresa grande cotiza más que empresa pequeña con el mismo arquetipo", () => {
    const pequena = cotizarPorArquetipo({ arquetipo: "B", tamano: "pequena", tarifaHora: 100000 });
    const grande = cotizarPorArquetipo({ arquetipo: "B", tamano: "grande", tarifaHora: 100000 });
    expect(grande.horasEstimadas).toBeGreaterThan(pequena.horasEstimadas);
  });
});
