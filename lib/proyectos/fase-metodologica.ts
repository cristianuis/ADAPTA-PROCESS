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

  if (pasosCompletos[11]) return "anclaje";
  if (pasosCompletos[10]) return "transferencia";
  if (pasosCompletos[9]) return "pilotaje";
  if (pasosCompletos[8]) return "arquitectura";
  if (pasosCompletos[7]) return "definicion";
  return "contextualizacion";
}
