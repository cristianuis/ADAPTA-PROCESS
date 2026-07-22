"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { indicadorSchema, type IndicadorInput } from "@/lib/validations/indicador.schema";

const MAX_INDICADORES_POR_PROCESO = 3;

export async function listarIndicadores(procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase.from("indicadores").select("*").eq("proceso_id", procesoId);
  return data ?? [];
}

export async function crearIndicador(input: IndicadorInput) {
  const parsed = indicadorSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { procesoId, nombre, tipo, formula, unidad, fuenteDatos, mecanismoCaptura, frecuencia, meta, responsable } =
    parsed.data;

  const { count } = await supabase
    .from("indicadores")
    .select("id", { count: "exact", head: true })
    .eq("proceso_id", procesoId);

  if ((count ?? 0) >= MAX_INDICADORES_POR_PROCESO) {
    return { error: `Máximo ${MAX_INDICADORES_POR_PROCESO} indicadores por proceso — es una regla del método, no un límite técnico.` };
  }

  const { data: proceso } = await supabase.from("procesos").select("proyecto_id").eq("id", procesoId).maybeSingle();

  const { error } = await supabase.from("indicadores").insert({
    proceso_id: procesoId,
    nombre,
    tipo,
    formula: formula || null,
    unidad: unidad || null,
    fuente_datos: fuenteDatos,
    mecanismo_captura: mecanismoCaptura,
    frecuencia: frecuencia || null,
    meta: meta ?? null,
    responsable: responsable || null,
  });

  if (error) return { error: "No se pudo guardar el indicador." };

  if (proceso) revalidatePath(`/proyectos/${proceso.proyecto_id}/procesos/${procesoId}`);
  return { error: null };
}
