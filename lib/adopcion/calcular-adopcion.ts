export function calcularPorcentajeAdopcion(casosRevisados: number, casosConformes: number): number {
  if (casosRevisados <= 0) return 0;
  return Number(((casosConformes / casosRevisados) * 100).toFixed(1));
}

export type Semaforo = "verde" | "amarillo" | "rojo";

/**
 * Semáforo simple contra meta: dentro del 10% de la meta = amarillo, cumple o supera = verde,
 * más de 10% por debajo = rojo. Funciona para métricas donde "más alto es mejor".
 */
export function calcularSemaforo(valor: number, meta: number): Semaforo {
  if (meta === 0) return "verde";
  const ratio = valor / meta;
  if (ratio >= 1) return "verde";
  if (ratio >= 0.9) return "amarillo";
  return "rojo";
}
