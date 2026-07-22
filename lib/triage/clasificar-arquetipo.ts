import type { Arquetipo, Disparador } from "@/lib/supabase/types";

export interface TriageInput {
  p1: 0 | 1 | 2;
  p2: 0 | 1 | 2;
  p3: 0 | 1 | 2;
  p4: 0 | 1 | 2;
  p5: Disparador;
  p6: 0 | 1 | 2;
}

export interface TriageResultado {
  arquetipo: Arquetipo;
  puntaje: number;
  alertaGobierno: boolean;
}

/** Datos de tamaño de la empresa (campos ya existentes en `clientes`), usados solo para
 *  distinguir Tipo A de Tipo B cuando el puntaje de triage es bajo — ver `esEmpresaJovenPequena`. */
export interface PerfilEmpresa {
  numEmpleados?: number | null;
  facturacionAnual?: number | null;
}

/** Umbral de empleados por debajo del cual una empresa cuenta como "pequeña" para el criterio de arquetipo. */
export const EMPRESA_PEQUENA_EMPLEADOS_MAX = 15;

/** Umbral de facturación anual (COP) por debajo del cual una empresa cuenta como "pequeña". */
export const EMPRESA_PEQUENA_FACTURACION_MAX = 800_000_000;

/**
 * Una empresa se considera "joven/pequeña" si al menos uno de sus indicadores de tamaño
 * disponibles está por debajo de su umbral (ver constantes arriba). Si no hay ningún dato
 * de perfil cargado todavía (cliente sin `num_empleados`/`facturacion_anual` diligenciados),
 * se asume joven/pequeña por defecto — preserva el comportamiento histórico del triage
 * cuando esos campos aún no existen.
 */
export function esEmpresaJovenPequena(perfil?: PerfilEmpresa): boolean {
  if (!perfil) return true;
  const { numEmpleados, facturacionAnual } = perfil;
  if (numEmpleados == null && facturacionAnual == null) return true;
  if (typeof numEmpleados === "number" && numEmpleados <= EMPRESA_PEQUENA_EMPLEADOS_MAX) return true;
  if (typeof facturacionAnual === "number" && facturacionAnual <= EMPRESA_PEQUENA_FACTURACION_MAX) return true;
  return false;
}

/**
 * Clasifica el arquetipo de intervención a partir de las 6 respuestas de triage y,
 * opcionalmente, del perfil de tamaño de la empresa (ver `esEmpresaJovenPequena`).
 * Función pura — sin acceso a base de datos, ver Sección 9.A paso 6 del blueprint.
 */
export function clasificarArquetipo(r: TriageInput, perfil?: PerfilEmpresa): TriageResultado {
  const puntaje = r.p1 + r.p2 + r.p3 + r.p4 + r.p6;
  const alertaGobierno = r.p6 === 0;

  if (r.p5 === "requisito_externo") {
    return { arquetipo: "E", puntaje, alertaGobierno };
  }
  if (r.p1 === 2 && r.p2 === 0) {
    return { arquetipo: "C", puntaje, alertaGobierno };
  }
  if (puntaje <= 2) {
    // Puntaje bajo por sí solo no basta: una empresa establecida con caos de proceso
    // (no joven/pequeña) y disparador de problema o crecimiento es Tipo B, no Tipo A.
    // Aquí p5 solo puede ser "problema" o "crecimiento" (requisito_externo ya salió arriba).
    if (esEmpresaJovenPequena(perfil)) {
      return { arquetipo: "A", puntaje, alertaGobierno };
    }
    return { arquetipo: "B", puntaje, alertaGobierno };
  }
  if (puntaje <= 4 && r.p5 === "crecimiento") {
    return { arquetipo: "B", puntaje, alertaGobierno };
  }
  if (puntaje <= 5) {
    return { arquetipo: "B", puntaje, alertaGobierno };
  }
  if (puntaje >= 6) {
    return { arquetipo: "D", puntaje, alertaGobierno };
  }
  return { arquetipo: "A", puntaje, alertaGobierno };
}

export const ARQUETIPO_INFO: Record<Arquetipo, { titulo: string; descripcion: string }> = {
  A: {
    titulo: "Arquetipo A — Fundacional",
    descripcion:
      "La empresa tiene poca o nula documentación de procesos y baja madurez de gestión. La ruta prioriza diseñar desde cero un conjunto acotado de procesos misionales, con foco en dejar una base operativa simple antes de escalar en complejidad.",
  },
  B: {
    titulo: "Arquetipo B — Crecimiento",
    descripcion:
      "La empresa está creciendo y sus procesos actuales empiezan a mostrar fricción. La ruta prioriza rediseñar los procesos que más impactan la operación diaria y dejar indicadores mínimos para sostener el crecimiento sin perder control.",
  },
  C: {
    titulo: "Arquetipo C — Documentada pero muerta",
    descripcion:
      "Existe documentación formal de procesos, pero nadie la usa en el día a día. La ruta prioriza entender por qué la documentación no se adoptó (gobierno, cultura, diseño poco realista) antes de rediseñar cualquier proceso nuevo.",
  },
  D: {
    titulo: "Arquetipo D — Transformación profunda",
    descripcion:
      "La empresa presenta múltiples síntomas de baja madurez en documentación, medición, propiedad de proceso y estructura de decisión simultáneamente. La ruta es la más extensa: cubre las 6 fases del modelo ADAPTA con mayor profundidad e intensidad de acompañamiento.",
  },
  E: {
    titulo: "Arquetipo E — Requisito externo",
    descripcion:
      "El disparador del proyecto es un requisito externo con plazo (ej. certificación, cliente, regulación). La ruta se diseña hacia atrás desde la fecha límite, priorizando los procesos y evidencias exigidas por el requisito sobre cualquier otra consideración de madurez.",
  },
};
