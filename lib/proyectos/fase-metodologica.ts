import type { FaseMetodologica } from "@/lib/supabase/types";

/**
 * Traduce la completitud de los 12 pasos del recorrido guiado a una de las
 * seis fases metodológicas. La fase es un dato derivado, nunca capturado.
 */
export function derivarFaseMetodologica(
  pasosCompletos: readonly boolean[]
): FaseMetodologica {
  if (pasosCompletos.length !== 12) {
    throw new Error("El recorrido guiado debe contener exactamente 12 pasos");
  }

  // Un entregable posterior puede existir aunque falten entrevistas o un
  // AS-IS. La fase debe reflejar el primer paso pendiente, no el hito más
  // avanzado encontrado de manera aislada.
  const primerPendiente = pasosCompletos.findIndex((completo) => !completo);
  if (primerPendiente === -1 || primerPendiente >= 10) return "anclaje";
  if (primerPendiente >= 9) return "transferencia";
  if (primerPendiente >= 8) return "pilotaje";
  if (primerPendiente >= 4) return "arquitectura";
  if (primerPendiente >= 2) return "definicion";
  return "contextualizacion";
}
