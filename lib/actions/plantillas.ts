"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  plantillaSchema,
  aplicarPlantillaSchema,
  type PlantillaInput,
  type AplicarPlantillaInput,
} from "@/lib/validations/plantilla.schema";
import type { EstructuraPlantilla } from "@/lib/supabase/types";

export async function listarPlantillas() {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("plantillas_proceso")
    .select("*")
    .eq("consultor_id", consultor.id)
    .order("veces_usada", { ascending: false });
  return data ?? [];
}

/** Sugerencias basadas en biblioteca acumulada: plantillas del mismo sector/tipo de proceso. */
export async function sugerirPlantillas(sector: string | null, tipoProceso: string | null) {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  let query = supabase.from("plantillas_proceso").select("*").eq("consultor_id", consultor.id);
  if (sector) query = query.eq("sector", sector);
  if (tipoProceso) query = query.eq("tipo_proceso", tipoProceso);
  const { data } = await query.order("veces_usada", { ascending: false }).limit(5);
  return data ?? [];
}

/** Captura la estructura (SIPOC + actividades + indicadores) de un proceso ya diseñado como plantilla reutilizable. */
export async function crearPlantillaDesdeProceso(procesoId: string, input: PlantillaInput) {
  const parsed = plantillaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const [{ data: sipoc }, { data: actividades }, { data: indicadores }] = await Promise.all([
    supabase.from("sipoc").select("*").eq("proceso_id", procesoId).maybeSingle(),
    supabase.from("actividades").select("*").eq("proceso_id", procesoId).order("orden"),
    supabase.from("indicadores").select("nombre, tipo").eq("proceso_id", procesoId),
  ]);

  const estructura: EstructuraPlantilla = {
    sipoc: sipoc
      ? {
          proveedores: sipoc.proveedores ?? [],
          entradas: sipoc.entradas ?? [],
          pasos: sipoc.pasos ?? [],
          salidas: sipoc.salidas ?? [],
          clientes: sipoc.clientes ?? [],
        }
      : undefined,
    actividades: (actividades ?? []).map((a) => ({
      orden: a.orden,
      nombre: a.nombre,
      rolResponsable: a.rol_responsable ?? undefined,
      rolAprobador: a.rol_aprobador ?? undefined,
    })),
    indicadoresSugeridos: indicadores ?? [],
  };

  const { nombre, sector, tipoProceso, descripcion } = parsed.data;

  const { error } = await supabase.from("plantillas_proceso").insert({
    consultor_id: consultor.id,
    nombre,
    sector: sector || null,
    tipo_proceso: tipoProceso || null,
    descripcion: descripcion || null,
    estructura,
  });

  if (error) return { error: "No se pudo guardar la plantilla." };

  revalidatePath("/biblioteca");
  return { error: null };
}

/** Crea un proceso nuevo en un proyecto a partir de una plantilla de la biblioteca. */
export async function aplicarPlantilla(input: AplicarPlantillaInput) {
  const parsed = aplicarPlantillaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { plantillaId, proyectoId, nombreProceso } = parsed.data;

  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { data: plantilla } = await supabase
    .from("plantillas_proceso")
    .select("*")
    .eq("id", plantillaId)
    .eq("consultor_id", consultor.id)
    .maybeSingle();

  if (!plantilla) return { error: "Plantilla no encontrada." };

  const { data: proceso, error: procesoError } = await supabase
    .from("procesos")
    .insert({
      proyecto_id: proyectoId,
      nombre: nombreProceso,
      tipo: (plantilla.tipo_proceso as "estrategico" | "misional" | "apoyo") ?? "misional",
      objetivo: plantilla.descripcion,
    })
    .select("id")
    .single();

  if (procesoError || !proceso) return { error: "No se pudo crear el proceso desde la plantilla." };

  const estructura = plantilla.estructura;

  if (estructura.sipoc) {
    await supabase.from("sipoc").insert({ proceso_id: proceso.id, ...estructura.sipoc });
  }

  if (estructura.actividades && estructura.actividades.length > 0) {
    await supabase.from("actividades").insert(
      estructura.actividades.map((a) => ({
        proceso_id: proceso.id,
        orden: a.orden,
        nombre: a.nombre,
        rol_responsable: a.rolResponsable ?? null,
        rol_aprobador: a.rolAprobador ?? null,
      }))
    );
  }

  await supabase
    .from("plantillas_proceso")
    .update({ veces_usada: plantilla.veces_usada + 1 })
    .eq("id", plantillaId);

  revalidatePath(`/proyectos/${proyectoId}/procesos`);
  redirect(`/proyectos/${proyectoId}/procesos/${proceso.id}`);
}
