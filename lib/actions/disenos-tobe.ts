"use server";

import { revalidatePath } from "next/cache";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import {
  disenoTobeSchema,
  pasoTobeSchema,
  type DisenoTobeInput,
  type PasoTobeInput,
} from "@/lib/validations/diseno-tobe.schema";

function ruta(proyectoId: string, procesoId: string) {
  return `/proyectos/${proyectoId}/procesos/${procesoId}`;
}

export async function obtenerDisenoTobe(procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data: diseno, error } = await supabase.from("disenos_tobe")
    .select("*").eq("proceso_id", procesoId).maybeSingle();
  if (error) throw new Error("No se pudo consultar el diseño TO-BE.");
  if (!diseno) return { diseno: null, pasos: [] };

  const { data: pasos, error: pasosError } = await supabase.from("pasos_tobe")
    .select("*").eq("diseno_id", diseno.id).order("orden");
  if (pasosError) throw new Error("No se pudieron consultar los pasos TO-BE.");
  return { diseno, pasos: pasos ?? [] };
}

export async function guardarDisenoTobe(input: DisenoTobeInput) {
  const parsed = disenoTobeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireConsultor();
  const supabase = await createClient();
  const { data: proceso, error: procesoError } = await supabase.from("procesos")
    .select("proyecto_id").eq("id", parsed.data.procesoId).maybeSingle();
  if (procesoError || !proceso) return { error: "El proceso no existe o no tienes acceso." };

  const { data: actual, error: consultaError } = await supabase.from("disenos_tobe")
    .select("id, estado").eq("proceso_id", parsed.data.procesoId).maybeSingle();
  if (consultaError) return { error: "No se pudo consultar el diseño actual." };
  if (actual?.estado === "validado") return { error: "Reabre el diseño antes de editarlo." };

  const valores = {
    objetivo: parsed.data.objetivo,
    criterio_validacion: parsed.data.criterioValidacion,
    decisiones: parsed.data.decisiones,
  };
  const { error } = actual
    ? await supabase.from("disenos_tobe").update(valores).eq("id", actual.id)
    : await supabase.from("disenos_tobe").insert({
        ...valores,
        proyecto_id: proceso.proyecto_id,
        proceso_id: parsed.data.procesoId,
      });
  if (error) return { error: "No se pudo guardar el diseño TO-BE." };
  revalidatePath(ruta(proceso.proyecto_id, parsed.data.procesoId));
  return { error: null };
}

export async function agregarPasoTobe(input: PasoTobeInput) {
  const parsed = pasoTobeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  await requireConsultor();
  const supabase = await createClient();
  const { data: diseno, error: disenoError } = await supabase.from("disenos_tobe")
    .select("id, proyecto_id, proceso_id, estado").eq("id", parsed.data.disenoId).maybeSingle();
  if (disenoError || !diseno) return { error: "Diseño inexistente o sin acceso." };
  if (diseno.estado !== "borrador") return { error: "Reabre el diseño antes de añadir pasos." };

  if (parsed.data.hallazgoId) {
    const { data: hallazgo, error } = await supabase.from("hallazgos")
      .select("id, estado_evidencia").eq("id", parsed.data.hallazgoId)
      .eq("proyecto_id", diseno.proyecto_id).maybeSingle();
    if (error || !hallazgo) return { error: "El hallazgo no pertenece a este proyecto." };
    if (!["cita_verificada", "validado_consultor"].includes(hallazgo.estado_evidencia)) {
      return { error: "El hallazgo debe tener evidencia revisada." };
    }
  }

  const { data: ultimo, error: ordenError } = await supabase.from("pasos_tobe")
    .select("orden").eq("diseno_id", diseno.id).order("orden", { ascending: false }).limit(1);
  if (ordenError) return { error: "No se pudo consultar el orden de los pasos." };
  const { error } = await supabase.from("pasos_tobe").insert({
    proyecto_id: diseno.proyecto_id,
    diseno_id: diseno.id,
    orden: (ultimo?.[0]?.orden ?? 0) + 1,
    nombre: parsed.data.nombre,
    responsable: parsed.data.responsable,
    cambio: parsed.data.cambio,
    tipo_cambio: parsed.data.tipoCambio,
    automatizacion: parsed.data.automatizacion,
    hallazgo_id: parsed.data.hallazgoId,
  });
  if (error) return { error: "No se pudo añadir el paso. Actualiza la página si otro usuario lo editó." };
  revalidatePath(ruta(diseno.proyecto_id, diseno.proceso_id));
  return { error: null };
}

export async function quitarPasoTobe(pasoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data: paso, error: pasoError } = await supabase.from("pasos_tobe")
    .select("id, diseno_id").eq("id", pasoId).maybeSingle();
  if (pasoError || !paso) return { error: "Paso inexistente o sin acceso." };
  const { data: diseno, error: disenoError } = await supabase.from("disenos_tobe")
    .select("proyecto_id, proceso_id, estado").eq("id", paso.diseno_id).maybeSingle();
  if (disenoError || !diseno || diseno.estado !== "borrador") {
    return { error: "Reabre el diseño antes de quitar pasos." };
  }
  const { error } = await supabase.from("pasos_tobe").delete().eq("id", pasoId);
  if (error) return { error: "No se pudo quitar el paso." };
  revalidatePath(ruta(diseno.proyecto_id, diseno.proceso_id));
  return { error: null };
}

export async function cambiarEstadoDisenoTobe(disenoId: string, estado: "borrador" | "validado") {
  await requireConsultor();
  const supabase = await createClient();
  const { data: diseno, error: consultaError } = await supabase.from("disenos_tobe")
    .select("proyecto_id, proceso_id").eq("id", disenoId).maybeSingle();
  if (consultaError || !diseno) return { error: "Diseño inexistente o sin acceso." };
  const { error } = await supabase.from("disenos_tobe")
    .update({ estado, validado_at: estado === "validado" ? new Date().toISOString() : null })
    .eq("id", disenoId);
  if (error) return { error: "Para validar, incluye al menos un cambio ligado a un hallazgo con evidencia revisada." };
  revalidatePath(ruta(diseno.proyecto_id, diseno.proceso_id));
  return { error: null };
}
