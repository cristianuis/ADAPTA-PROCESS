import { DIMENSIONES_PROCESO, DIMENSIONES_EMPRESA } from "./descriptores";
import type { TipoPEMM } from "@/lib/supabase/types";

export type PuntajesPEMM = Partial<Record<string, number | null | undefined>>;

/**
 * Nivel resultante de una evaluación PEMM = el MÍNIMO de sus habilitadores
 * (criterio de Hammer — el eslabón más débil determina el nivel real del proceso,
 * no el promedio, que enmascararía la brecha).
 */
export function calcularNivelResultante(tipo: TipoPEMM, puntajes: PuntajesPEMM): number | null {
  const dimensiones = tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;
  const valores = dimensiones
    .map((d) => puntajes[d])
    .filter((v): v is number => typeof v === "number");

  if (valores.length !== dimensiones.length) return null;
  return Math.min(...valores);
}
