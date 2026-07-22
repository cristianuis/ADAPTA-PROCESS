"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  entrevistaSchema,
  validarHallazgoSchema,
  type EntrevistaInput,
  type ValidarHallazgoInput,
} from "@/lib/validations/entrevista.schema";

export async function listarEntrevistas(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("entrevistas")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function obtenerEntrevista(entrevistaId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase.from("entrevistas").select("*").eq("id", entrevistaId).maybeSingle();
  return data;
}

export async function crearEntrevista(input: EntrevistaInput) {
  const parsed = entrevistaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, entrevistadoNombre, entrevistadoCargo, nivel, fecha, transcripcion } = parsed.data;

  const { data, error } = await supabase
    .from("entrevistas")
    .insert({
      proyecto_id: proyectoId,
      entrevistado_nombre: entrevistadoNombre,
      entrevistado_cargo: entrevistadoCargo || null,
      nivel,
      fecha: fecha || null,
      transcripcion: transcripcion || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la entrevista." };

  revalidatePath(`/proyectos/${proyectoId}/entrevistas`);
  redirect(`/proyectos/${proyectoId}/entrevistas/${data.id}`);
}

/**
 * Promueve un hallazgo propuesto por la IA (hallazgos_ia[indice]) a la tabla `hallazgos`.
 * Este es el único punto donde un hallazgo de IA se convierte en dato usable en la matriz
 * de priorización — la IA propone, el consultor decide (asigna esfuerzo, confirma impacto).
 */
export async function validarHallazgoIA(input: ValidarHallazgoInput) {
  const parsed = validarHallazgoSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { entrevistaId, proyectoId, indice, esfuerzo, impacto } = parsed.data;

  const { data: entrevista } = await supabase
    .from("entrevistas")
    .select("hallazgos_ia, hallazgos_validados")
    .eq("id", entrevistaId)
    .maybeSingle();

  const propuesto = entrevista?.hallazgos_ia?.[indice];
  if (!propuesto) return { error: "El hallazgo propuesto ya no existe." };

  const { data: hallazgoCreado, error: insertError } = await supabase
    .from("hallazgos")
    .insert({
      proyecto_id: proyectoId,
      titulo: propuesto.titulo,
      descripcion: propuesto.descripcion,
      categoria: propuesto.categoria,
      impacto: impacto ?? propuesto.impacto_estimado,
      esfuerzo,
      fuente: "entrevista",
      fuente_id: entrevistaId,
      origen: "ia",
    })
    .select("id")
    .single();

  if (insertError || !hallazgoCreado) return { error: "No se pudo guardar el hallazgo validado." };

  const validados = [
    ...(entrevista?.hallazgos_validados ?? []),
    { ...propuesto, indice, hallazgo_id: hallazgoCreado.id },
  ];

  await supabase.from("entrevistas").update({ hallazgos_validados: validados }).eq("id", entrevistaId);

  revalidatePath(`/proyectos/${proyectoId}/entrevistas/${entrevistaId}`);
  revalidatePath(`/proyectos/${proyectoId}/hallazgos`);
  return { error: null };
}
