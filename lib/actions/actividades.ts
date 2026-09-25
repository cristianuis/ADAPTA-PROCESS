"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { actividadSchema, type ActividadInput } from "@/lib/validations/actividad.schema";

export async function listarActividades(procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actividades")
    .select("*")
    .eq("proceso_id", procesoId)
    .order("orden", { ascending: true });
  if (error) throw new Error("No se pudieron consultar las actividades AS-IS.");
  return data ?? [];
}

export async function crearActividad(input: ActividadInput) {
  const parsed = actividadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const {
    procesoId,
    orden,
    nombre,
    descripcion,
    rolResponsable,
    rolAprobador,
    rolesConsultados,
    rolesInformados,
    tiempoEstimadoMin,
    esValorAgregado,
    sistemaSoporte,
  } = parsed.data;

  const { data: proceso } = await supabase.from("procesos").select("proyecto_id").eq("id", procesoId).maybeSingle();

  const { error } = await supabase.from("actividades").insert({
    proceso_id: procesoId,
    orden,
    nombre,
    descripcion: descripcion || null,
    rol_responsable: rolResponsable || null,
    rol_aprobador: rolAprobador || null,
    roles_consultados: rolesConsultados,
    roles_informados: rolesInformados,
    tiempo_estimado_min: tiempoEstimadoMin ?? null,
    es_valor_agregado: esValorAgregado,
    sistema_soporte: sistemaSoporte || null,
  });

  if (error) return { error: "No se pudo guardar la actividad." };

  if (proceso) revalidatePath(`/proyectos/${proceso.proyecto_id}/procesos/${procesoId}`);
  return { error: null };
}

export async function actualizarActividad(actividadId: string, input: ActividadInput) {
  const parsed = actividadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireConsultor();
  const supabase = await createClient();
  const { data: actividad, error: consultaError } = await supabase.from("actividades")
    .select("id").eq("id", actividadId).eq("proceso_id", parsed.data.procesoId).maybeSingle();
  if (consultaError || !actividad) return { error: "Actividad inexistente o sin acceso." };
  const { data: proceso, error: procesoError } = await supabase.from("procesos")
    .select("proyecto_id").eq("id", parsed.data.procesoId).maybeSingle();
  if (procesoError || !proceso) return { error: "Proceso inexistente o sin acceso." };
  const valor = parsed.data;
  const { error } = await supabase.from("actividades").update({
    nombre: valor.nombre,
    descripcion: valor.descripcion || null,
    rol_responsable: valor.rolResponsable || null,
    rol_aprobador: valor.rolAprobador || null,
    roles_consultados: valor.rolesConsultados,
    roles_informados: valor.rolesInformados,
    tiempo_estimado_min: valor.tiempoEstimadoMin ?? null,
    es_valor_agregado: valor.esValorAgregado,
    sistema_soporte: valor.sistemaSoporte || null,
  }).eq("id", actividadId).eq("proceso_id", valor.procesoId);
  if (error) return { error: "No se pudo actualizar la actividad." };
  revalidatePath(`/proyectos/${proceso.proyecto_id}/procesos/${valor.procesoId}`);
  return { error: null };
}

export async function eliminarActividad(actividadId: string, procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data: proceso, error: procesoError } = await supabase.from("procesos")
    .select("proyecto_id").eq("id", procesoId).maybeSingle();
  if (procesoError || !proceso) return { error: "Proceso inexistente o sin acceso." };
  const { data, error } = await supabase.from("actividades")
    .delete().eq("id", actividadId).eq("proceso_id", procesoId).select("id").maybeSingle();
  if (error || !data) return { error: "No se pudo retirar la actividad." };
  revalidatePath(`/proyectos/${proceso.proyecto_id}/procesos/${procesoId}`);
  return { error: null };
}
