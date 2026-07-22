"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  auditoriaSchema,
  causasIdentificadasSchema,
  type AuditoriaInput,
  type CausasIdentificadasInput,
} from "@/lib/validations/auditoria.schema";
import { calcularPorcentajeAdopcion } from "@/lib/adopcion/calcular-adopcion";

export async function actualizarCausasIdentificadas(input: CausasIdentificadasInput) {
  const parsed = causasIdentificadasSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { auditoriaId, proyectoId, causas } = parsed.data;
  const { error } = await supabase
    .from("auditorias_adopcion")
    .update({ causas_identificadas: causas })
    .eq("id", auditoriaId);

  if (error) return { error: "No se pudo guardar el análisis de causas." };

  revalidatePath(`/proyectos/${proyectoId}/adopcion/${auditoriaId}`);
  return { error: null };
}

export async function listarAuditorias(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("auditorias_adopcion")
    .select("*, procesos(nombre)")
    .eq("proyecto_id", proyectoId)
    .order("fecha", { ascending: false });
  return data ?? [];
}

export async function obtenerAuditoria(auditoriaId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("auditorias_adopcion")
    .select("*, procesos(nombre)")
    .eq("id", auditoriaId)
    .maybeSingle();
  return data;
}

export async function crearAuditoria(input: AuditoriaInput) {
  const parsed = auditoriaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, procesoId, fecha, casosRevisados, casosConformes, desviaciones, causasIdentificadas } =
    parsed.data;

  if (casosConformes > casosRevisados) {
    return { error: "Los casos conformes no pueden ser más que los casos revisados." };
  }

  const porcentaje = calcularPorcentajeAdopcion(casosRevisados, casosConformes);

  const { data, error } = await supabase
    .from("auditorias_adopcion")
    .insert({
      proyecto_id: proyectoId,
      proceso_id: procesoId,
      fecha,
      casos_revisados: casosRevisados,
      casos_conformes: casosConformes,
      porcentaje_adopcion: porcentaje,
      desviaciones,
      causas_identificadas: causasIdentificadas || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo guardar la auditoría." };

  revalidatePath(`/proyectos/${proyectoId}/adopcion`);
  redirect(`/proyectos/${proyectoId}/adopcion/${data.id}`);
}
