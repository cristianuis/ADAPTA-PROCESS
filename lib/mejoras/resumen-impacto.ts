import type { Database } from "@/lib/supabase/types";

type Iniciativa = Database["public"]["Tables"]["iniciativas_mejora"]["Row"];
type Medicion = Database["public"]["Tables"]["mediciones_impacto"]["Row"];

const ESTADOS_EXCLUIDOS = new Set<Iniciativa["estado"]>(["borrador", "descartada"]);

export function ultimaMedicionAnualValidada(mediciones: Medicion[]) {
  return mediciones
    .filter((medicion) => medicion.tipo !== "linea_base" && medicion.validado_cliente)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.created_at.localeCompare(a.created_at))[0] ?? null;
}

export function prepararSeriesImpacto(iniciativas: Iniciativa[], mediciones: Medicion[]) {
  const grupos = new Map<string, Array<{
    nombre: string;
    objetivo: number;
    realizado: number | null;
  }>>();

  for (const iniciativa of iniciativas) {
    if (ESTADOS_EXCLUIDOS.has(iniciativa.estado)) continue;
    const serie = grupos.get(iniciativa.moneda) ?? [];
    const ultima = ultimaMedicionAnualValidada(
      mediciones.filter((medicion) => medicion.iniciativa_id === iniciativa.id),
    );
    serie.push({
      nombre: iniciativa.titulo.slice(0, 24),
      objetivo: Number(iniciativa.beneficio_anual_objetivo),
      realizado: ultima ? Number(ultima.beneficio_anual_realizado) : null,
    });
    grupos.set(iniciativa.moneda, serie);
  }

  return [...grupos.entries()].map(([moneda, datos]) => ({ moneda, datos }));
}
