export interface CalculoTarifaInput {
  costoMensualTotal: number;
  utilidadDeseadaMensual: number;
  horasTotalesMes: number;
  porcentajeFacturable?: number; // default 0.55 (55%), ver blueprint Módulo 10.1
}

export interface CalculoTarifaResultado {
  horasFacturables: number;
  tarifaHoraObjetivo: number;
}

/** Tarifa hora objetivo = (Costo mensual total + Utilidad deseada) / Horas facturables reales. */
export function calcularTarifaHora(input: CalculoTarifaInput): CalculoTarifaResultado {
  const porcentajeFacturable = input.porcentajeFacturable ?? 0.55;
  const horasFacturables = input.horasTotalesMes * porcentajeFacturable;
  const tarifaHoraObjetivo = (input.costoMensualTotal + input.utilidadDeseadaMensual) / horasFacturables;

  return {
    horasFacturables: Number(horasFacturables.toFixed(1)),
    tarifaHoraObjetivo: Number(tarifaHoraObjetivo.toFixed(0)),
  };
}

const ESFUERZO_BASE_HORAS_POR_FASE: Record<string, number> = {
  diagnostico: 40,
  definicion: 30,
  arquitectura: 60,
  pilotaje: 50,
  transferencia: 30,
  anclaje: 20,
};

const MULTIPLICADOR_ARQUETIPO: Record<string, number> = {
  A: 0.8,
  B: 1,
  C: 0.9,
  D: 1.5,
  E: 1.1,
};

const MULTIPLICADOR_TAMANO: Record<"pequena" | "mediana" | "grande", number> = {
  pequena: 0.7,
  mediana: 1,
  grande: 1.4,
};

export interface CotizacionInput {
  arquetipo: "A" | "B" | "C" | "D" | "E";
  tamano: "pequena" | "mediana" | "grande";
  tarifaHora: number;
}

export interface CotizacionResultado {
  horasEstimadas: number;
  rangoMinimo: number;
  rangoMaximo: number;
}

/** Cotizador por arquetipo — genera un rango, no una cifra única (blueprint Módulo 10.2). */
export function cotizarPorArquetipo(input: CotizacionInput): CotizacionResultado {
  const horasBase = Object.values(ESFUERZO_BASE_HORAS_POR_FASE).reduce((a, b) => a + b, 0);
  const horasEstimadas = Math.round(
    horasBase * MULTIPLICADOR_ARQUETIPO[input.arquetipo] * MULTIPLICADOR_TAMANO[input.tamano]
  );

  return {
    horasEstimadas,
    rangoMinimo: Math.round(horasEstimadas * 0.85 * input.tarifaHora),
    rangoMaximo: Math.round(horasEstimadas * 1.25 * input.tarifaHora),
  };
}
