"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { procesoSchema, estadoProcesoSchema, type ProcesoInput } from "@/lib/validations/proceso.schema";
import type { EstadoProceso } from "@/lib/supabase/types";

export async function listarProcesos(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("procesos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("prioridad", { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function obtenerProceso(procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase.from("procesos").select("*").eq("id", procesoId).maybeSingle();
  return data;
}

export async function crearProceso(input: ProcesoInput) {
  const parsed = procesoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, codigo, nombre, tipo, objetivo, alcanceInicio, alcanceFin, duenoNombre, duenoCargo, prioridad } =
    parsed.data;

  const { data, error } = await supabase
    .from("procesos")
    .insert({
      proyecto_id: proyectoId,
      codigo: codigo || null,
      nombre,
      tipo,
      objetivo: objetivo || null,
      alcance_inicio: alcanceInicio || null,
      alcance_fin: alcanceFin || null,
      dueno_nombre: duenoNombre || null,
      dueno_cargo: duenoCargo || null,
      prioridad: prioridad ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear el proceso." };

  revalidatePath(`/proyectos/${proyectoId}/procesos`);
  redirect(`/proyectos/${proyectoId}/procesos/${data.id}`);
}

export async function actualizarEstadoProceso(procesoId: string, proyectoId: string, estado: EstadoProceso) {
  const parsed = estadoProcesoSchema.safeParse({ estado });
  if (!parsed.success) return { error: "Estado inválido" };

  await requireConsultor();
  const supabase = await createClient();
  const { error } = await supabase.from("procesos").update({ estado }).eq("id", procesoId);

  if (error) return { error: "No se pudo actualizar el estado." };

  revalidatePath(`/proyectos/${proyectoId}/procesos`);
  return { error: null };
}
