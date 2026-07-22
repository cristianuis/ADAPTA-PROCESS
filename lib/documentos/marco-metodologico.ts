/**
 * Determina qué referencias metodológicas reales se usaron en ESTE proyecto, a partir de
 * señales concretas de los datos (no una lista fija idéntica en todos los entregables).
 * Ver Bloque 1.2 — cada framework aparece solo si hay evidencia de que efectivamente se aplicó.
 */
export interface SenalesMarcoMetodologico {
  /** Hay al menos una evaluación PEMM respondida para este proyecto. */
  tienePemm: boolean;
  /** Hay al menos un proceso con SIPOC documentado end-to-end. */
  tieneSipoc: boolean;
  /** Hay al menos un proceso clasificado por tipo (estratégico/misional/apoyo). */
  tieneProcesosClasificados: boolean;
  /** Hay al menos un indicador definido con fuente de datos. */
  tieneIndicadores: boolean;
  /** Hay al menos un hallazgo de categoría "proceso" con impacto_estimado/impacto >= 4. */
  tieneHallazgoAltoImpactoProceso: boolean;
  /** Alguna entrevista registró nivel_resistencia "medio" o "alto". */
  tieneResistenciaCambio: boolean;
}

export interface ReferenciaMetodologica {
  framework: string;
  aplicacion: string;
}

export function determinarMarcoMetodologico(senales: SenalesMarcoMetodologico): ReferenciaMetodologica[] {
  const referencias: ReferenciaMetodologica[] = [];

  if (senales.tienePemm) {
    referencias.push({
      framework: "Hammer — Process and Enterprise Maturity Model (PEMM)",
      aplicacion:
        "Usado para calcular el nivel de madurez de proceso y de empresa como el mínimo de sus habilitadores o capacidades — el eslabón más débil, no el promedio.",
    });
  }

  if (senales.tieneSipoc) {
    referencias.push({
      framework: "ISO 9001:2015 — enfoque basado en procesos",
      aplicacion:
        "Usado para documentar el proceso end-to-end (SIPOC), con trazabilidad de proveedores, entradas, salidas y clientes internos.",
    });
  }

  if (senales.tieneProcesosClasificados) {
    referencias.push({
      framework: "APQC Process Classification Framework (PCF)",
      aplicacion: "Usado para clasificar los procesos diseñados en estratégicos, misionales y de apoyo.",
    });
  }

  if (senales.tieneIndicadores) {
    referencias.push({
      framework: "Kaplan & Norton — Balanced Scorecard",
      aplicacion:
        "Usado como referencia para definir indicadores con fuente de datos y meta explícitas, evitando indicadores sin mecanismo de captura.",
    });
  }

  if (senales.tieneHallazgoAltoImpactoProceso) {
    referencias.push({
      framework: "Goldratt — Teoría de Restricciones",
      aplicacion:
        "Usado para priorizar el hallazgo de proceso de mayor impacto como la restricción crítica a intervenir primero.",
    });
  }

  if (senales.tieneResistenciaCambio) {
    referencias.push({
      framework: "Hiatt — Modelo ADKAR",
      aplicacion:
        "Usado para interpretar el nivel de resistencia al cambio detectado en las entrevistas dentro de la ruta de intervención.",
    });
  }

  return referencias;
}
