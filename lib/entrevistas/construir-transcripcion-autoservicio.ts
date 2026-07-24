export interface RespuestasAutoservicio {
  queRecibes: string;
  queHaces: string;
  queEntregas: string;
  queTeQuitaTiempo: string;
}

/**
 * Compone las 4 respuestas del intake de autoservicio como un pseudo-transcript,
 * para que pase por el mismo pipeline de análisis de IA (`/api/ia/analizar-entrevista`)
 * que una entrevista dirigida, sin ningún cambio en ese endpoint ni en su prompt.
 */
export function construirTranscripcionAutoservicio(respuestas: RespuestasAutoservicio): string {
  return `[Intake de autoservicio — la persona describió su propio proceso, sin entrevistador]

¿Qué recibes para empezar tu trabajo, y de quién?
${respuestas.queRecibes}

¿Qué haces con eso?
${respuestas.queHaces}

¿Qué entregas al terminar, y a quién?
${respuestas.queEntregas}

¿Qué es lo que más tiempo te quita sin agregar valor?
${respuestas.queTeQuitaTiempo}`;
}
