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

/**
 * Clasifica el arquetipo de intervención a partir de las 6 respuestas de triage.
 * Función pura — sin acceso a base de datos, ver Sección 9.A paso 6 del blueprint.
 */
export function clasificarArquetipo(r: TriageInput): TriageResultado {
  const puntaje = r.p1 + r.p2 + r.p3 + r.p4 + r.p6;
  const alertaGobierno = r.p6 === 0;

  if (r.p5 === "requisito_externo") {
    return { arquetipo: "E", puntaje, alertaGobierno };
  }
  if (r.p1 === 2 && r.p2 === 0) {
    return { arquetipo: "C", puntaje, alertaGobierno };
  }
  if (puntaje <= 2) {
    return { arquetipo: "A", puntaje, alertaGobierno };
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
