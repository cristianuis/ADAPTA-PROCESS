import { citaExisteEnFuente } from "@/lib/evidencia/validar-cita";
import type { AnalisisEntrevista } from "@/lib/validations/entrevista.schema";

/** La IA propone; solo pasan a revisión propuestas con una cita localizable
 * en el texto que realmente se analizó. No otorga validación humana. */
export function filtrarHallazgosCitados(
  analisis: AnalisisEntrevista,
  transcripcion: string
): { analisis: AnalisisEntrevista; descartados: number } {
  const hallazgos = analisis.hallazgos.filter((hallazgo) =>
    citaExisteEnFuente(transcripcion, hallazgo.cita_soporte)
  );
  return {
    analisis: { ...analisis, hallazgos },
    descartados: analisis.hallazgos.length - hallazgos.length,
  };
}
