"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { actividadSchema, type ActividadInput } from "@/lib/validations/actividad.schema";

export async function listarActividades(procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("actividades")
    .select("*")
    .eq("proceso_id", procesoId)
    .order("orden", { ascending: true });
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
