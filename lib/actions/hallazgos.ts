"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { hallazgoManualSchema, type HallazgoManualInput } from "@/lib/validations/hallazgo.schema";
import { citaExisteEnFuente } from "@/lib/evidencia/validar-cita";

export async function listarHallazgos(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hallazgos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("No se pudieron consultar los hallazgos.");
  return data ?? [];
}

export async function crearHallazgoManual(input: HallazgoManualInput) {
  const parsed = hallazgoManualSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, procesoId, titulo, descripcion, categoria, citaSoporte, impacto, esfuerzo, fuente, fuenteId } = parsed.data;

  if (fuente === "entrevista") {
    const { data: entrevista, error: entrevistaError } = await supabase.from("entrevistas")
      .select("proyecto_id, transcripcion, estado")
      .eq("id", fuenteId!)
      .eq("proyecto_id", proyectoId)
      .maybeSingle();
    if (entrevistaError || !entrevista || entrevista.estado !== "respondida" || !citaExisteEnFuente(entrevista.transcripcion, citaSoporte)) {
      return { error: "La cita debe aparecer en una entrevista respondida de esta intervención." };
    }
  }

  const { error } = await supabase.from("hallazgos").insert({
    proyecto_id: proyectoId,
    proceso_id: procesoId,
    titulo,
    descripcion: descripcion || null,
    categoria,
    impacto,
    esfuerzo,
    fuente,
    fuente_id: fuenteId,
    cita_soporte: citaSoporte,
    estado_evidencia: fuente === "entrevista" ? "cita_verificada" : "validado_consultor",
    origen: "manual",
  });

  if (error) return { error: "No se pudo guardar el hallazgo." };

  revalidatePath(`/proyectos/${proyectoId}/hallazgos`);
  return { error: null };
}
