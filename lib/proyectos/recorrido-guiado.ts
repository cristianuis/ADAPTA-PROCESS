export type EstadoPaso = "completado" | "actual" | "pendiente" | "fuera_de_secuencia";

export interface PasoRecorrido {
  numero: number;
  nombre: string;
  /** Número del paso cuya completitud es el prerrequisito real de este paso, o null si no
   * tiene (ej. pasos que corren en paralelo, como PEMM empresa y PEMM proceso — ninguno
   * depende del otro, ambos dependen de que exista triage). */
  prereq: number | null;
}

export const PASOS_RECORRIDO: PasoRecorrido[] = [
  { numero: 1, nombre: "Datos del cliente", prereq: null },
  { numero: 2, nombre: "Triage", prereq: 1 },
  { numero: 3, nombre: "PEMM — empresa", prereq: 2 },
  { numero: 4, nombre: "PEMM — proceso(s)", prereq: 2 },
  { numero: 5, nombre: "Entrevistas", prereq: 2 },
  { numero: 6, nombre: "Validar hallazgos propuestos", prereq: 5 },
  { numero: 7, nombre: "Cuantificar impacto y crear plan de mejora", prereq: 6 },
  { numero: 8, nombre: "Generar Informe de Diagnóstico", prereq: 7 },
  { numero: 9, nombre: "Seleccionar procesos críticos y dueños", prereq: 8 },
  { numero: 10, nombre: "Diseñar SIPOC, actividades e indicadores", prereq: 9 },
  { numero: 11, nombre: "Generar Manual de Procesos", prereq: 10 },
  { numero: 12, nombre: "Auditoría de adopción", prereq: 11 },
];

export interface PasoConEstado extends PasoRecorrido {
  completo: boolean;
  estado: EstadoPaso;
}

/**
 * completitud[i] = si el paso PASOS_RECORRIDO[i] (numero = i+1) está completo.
 *
 * "actual" es el primer paso incompleto en orden numérico. Para el resto de pasos
 * incompletos, se distingue entre "pendiente" (su propio prerrequisito SÍ está cumplido
 * — ej. PEMM proceso cuando ya hay triage pero el "actual" es PEMM empresa, que corre en
 * paralelo) y "fuera_de_secuencia" (su prerrequisito real no está cumplido — bloqueo
 * suave: sigue siendo clickeable, solo se ve distinto y avisa antes de continuar).
 */
export function calcularEstadosPasos(completitud: boolean[]): PasoConEstado[] {
  const primerIncompleto = completitud.findIndex((c) => !c);

  return PASOS_RECORRIDO.map((paso, i) => {
    const completo = completitud[i];
    let estado: EstadoPaso;

    if (completo) {
      estado = "completado";
    } else if (i === primerIncompleto) {
      estado = "actual";
    } else {
      const prereqIndex = paso.prereq === null ? null : paso.prereq - 1;
      const prereqCumplido = prereqIndex === null || completitud[prereqIndex];
      estado = prereqCumplido ? "pendiente" : "fuera_de_secuencia";
    }

    return { ...paso, completo, estado };
  });
}
