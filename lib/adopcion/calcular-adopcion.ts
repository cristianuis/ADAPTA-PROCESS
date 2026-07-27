export function calcularPorcentajeAdopcion(casosRevisados: number, casosConformes: number): number {
  if (casosRevisados <= 0) return 0;
  return Number(((casosConformes / casosRevisados) * 100).toFixed(1));
}

export type Semaforo = "verde" | "amarillo" | "rojo";

export type ObjetivoSemaforo =
  | { sentido: "mayor_es_mejor"; meta: number }
  | { sentido: "menor_es_mejor"; meta: number }
  | {
      sentido: "rango_objetivo";
      limiteInferior: number;
      limiteSuperior: number;
    };

/**
 * Evalúa un indicador según su dirección de mejora. Amarillo representa una
 * desviación máxima del 10% respecto de la meta o del ancho del rango.
 */
export function calcularSemaforo(
  valor: number,
  objetivo: ObjetivoSemaforo
): Semaforo {
  if (objetivo.sentido === "mayor_es_mejor") {
    if (valor >= objetivo.meta) return "verde";
    const tolerancia = Math.abs(objetivo.meta) * 0.1;
    return valor >= objetivo.meta - tolerancia ? "amarillo" : "rojo";
  }

  if (objetivo.sentido === "menor_es_mejor") {
    if (valor <= objetivo.meta) return "verde";
    const tolerancia = Math.abs(objetivo.meta) * 0.1;
    return valor <= objetivo.meta + tolerancia ? "amarillo" : "rojo";
  }

  const { limiteInferior, limiteSuperior } = objetivo;
  if (limiteInferior > limiteSuperior) {
    throw new RangeError("El límite inferior no puede superar el límite superior");
  }
  if (valor >= limiteInferior && valor <= limiteSuperior) return "verde";

  const tolerancia = (limiteSuperior - limiteInferior) * 0.1;
  const cercaDelRango =
    valor >= limiteInferior - tolerancia && valor <= limiteSuperior + tolerancia;
  return cercaDelRango ? "amarillo" : "rojo";
}
