"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  proyectoSchema,
  estadoProyectoSchema,
  type ProyectoInput,
} from "@/lib/validations/proyecto.schema";
import type { EstadoProyecto } from "@/lib/supabase/types";

export async function listarProyectos() {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("proyectos")
    .select("*, clientes(razon_social)")
    .eq("consultor_id", consultor.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function obtenerProyecto(proyectoId: string) {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("proyectos")
    .select("*, clientes(id, razon_social)")
    .eq("id", proyectoId)
    .eq("consultor_id", consultor.id)
    .maybeSingle();

  return data;
}

export async function crearProyecto(input: ProyectoInput) {
  const parsed = proyectoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { nombre, clienteId, estado, fechaInicio, fechaFinEstimada, valorContrato, modeloCobro } =
    parsed.data;

  const { data, error } = await supabase
    .from("proyectos")
    .insert({
      consultor_id: consultor.id,
      cliente_id: clienteId,
      nombre,
      estado,
      fecha_inicio: fechaInicio || null,
      fecha_fin_estimada: fechaFinEstimada || null,
      valor_contrato: valorContrato ?? null,
      modelo_cobro: modeloCobro || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No se pudo crear el proyecto. Intenta de nuevo." };
  }

  revalidatePath("/proyectos");
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/proyectos/${data.id}`);
}

export async function actualizarEstadoProyecto(proyectoId: string, estado: EstadoProyecto) {
  const parsed = estadoProyectoSchema.safeParse({ estado });
  if (!parsed.success) {
    return { error: "Estado inválido" };
  }

  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("proyectos")
    .update({ estado: parsed.data.estado })
    .eq("id", proyectoId)
    .eq("consultor_id", consultor.id);

  if (error) {
    return { error: "No se pudo actualizar el estado del proyecto." };
  }

  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${proyectoId}`);
  return { error: null };
}
