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
  { numero: 3, nombre: "Entrevistar a quienes ejecutan el trabajo", prereq: 2 },
  { numero: 4, nombre: "Levantar proceso AS-IS", prereq: 3 },
  { numero: 5, nombre: "PEMM — empresa", prereq: 2 },
  { numero: 6, nombre: "PEMM — proceso(s)", prereq: 4 },
  { numero: 7, nombre: "Validar hallazgos con evidencia", prereq: 4 },
  { numero: 8, nombre: "Priorizar y crear plan de mejora", prereq: 7 },
  { numero: 9, nombre: "Diseñar proceso TO-BE", prereq: 8 },
  { numero: 10, nombre: "Definir indicadores y manual", prereq: 9 },
  { numero: 11, nombre: "Auditar adopción en casos reales", prereq: 10 },
  { numero: 12, nombre: "Emitir Informe 360°", prereq: 11 },
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
