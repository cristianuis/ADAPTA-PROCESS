"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { medicionSchema, type MedicionInput } from "@/lib/validations/medicion.schema";

export async function listarMedicionesDeIndicador(indicadorId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediciones")
    .select("*")
    .eq("indicador_id", indicadorId)
    .order("periodo", { ascending: true });
  return data ?? [];
}

/** Trae todos los indicadores activos del proyecto (de todos sus procesos) con sus mediciones — tablero consolidado. */
export async function obtenerTableroIndicadores(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();

  const { data: procesos } = await supabase.from("procesos").select("id, nombre").eq("proyecto_id", proyectoId);
  const procesoIds = (procesos ?? []).map((p) => p.id);
  if (procesoIds.length === 0) return [];

  const { data: indicadores } = await supabase
    .from("indicadores")
    .select("*")
    .in("proceso_id", procesoIds)
    .eq("activo", true);

  if (!indicadores || indicadores.length === 0) return [];

  const { data: mediciones } = await supabase
    .from("mediciones")
    .select("*")
    .in(
      "indicador_id",
      indicadores.map((i) => i.id)
    )
    .order("periodo", { ascending: true });

  return indicadores.map((ind) => ({
    indicador: ind,
    procesoNombre: procesos?.find((p) => p.id === ind.proceso_id)?.nombre ?? "",
    mediciones: (mediciones ?? []).filter((m) => m.indicador_id === ind.id),
  }));
}

export async function registrarMedicion(input: MedicionInput) {
  const parsed = medicionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { indicadorId, periodo, valor, observaciones } = parsed.data;

  const { data: indicador } = await supabase
    .from("indicadores")
    .select("proceso_id, procesos(proyecto_id)")
    .eq("id", indicadorId)
    .maybeSingle();

  const { error } = await supabase.from("mediciones").insert({
    indicador_id: indicadorId,
    periodo,
    valor,
    observaciones: observaciones || null,
  });

  if (error) return { error: "No se pudo registrar la medición." };

  const proyectoId = (indicador as unknown as { procesos: { proyecto_id: string } | null })?.procesos?.proyecto_id;
  if (proyectoId) revalidatePath(`/proyectos/${proyectoId}/tablero`);
  return { error: null };
}
