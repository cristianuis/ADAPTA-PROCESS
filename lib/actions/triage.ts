"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { triageSchema, type TriageFormInput } from "@/lib/validations/triage.schema";
import { clasificarArquetipo } from "@/lib/triage/clasificar-arquetipo";

export async function obtenerTriage(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("triage_respuestas")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .maybeSingle();

  return data;
}

export async function guardarTriage(input: TriageFormInput) {
  const parsed = triageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // requireConsultor + el filtro por consultor_id en proyectos (vía RLS) garantiza
  // que solo se pueda guardar triage de un proyecto propio.
  await requireConsultor();
  const supabase = await createClient();

  const { proyectoId, p1, p2, p3, p4, p5, p6, notas } = parsed.data;

  const { arquetipo, puntaje, alertaGobierno } = clasificarArquetipo({ p1, p2, p3, p4, p5, p6 });

  const { error: triageError } = await supabase.from("triage_respuestas").upsert(
    {
      proyecto_id: proyectoId,
      p1_documentacion_existe: p1,
      p2_documentacion_se_usa: p2,
      p3_se_mide_desempeno: p3,
      p4_duenos_proceso: p4,
      p5_disparador: p5,
      p6_estructura_decision: p6,
      puntaje_total: puntaje,
      arquetipo_sugerido: arquetipo,
      alerta_gobierno: alertaGobierno,
      notas: notas || null,
    },
    { onConflict: "proyecto_id" }
  );

  if (triageError) {
    return { error: "No se pudo guardar el triage. Intenta de nuevo." };
  }

  const { error: proyectoError } = await supabase
    .from("proyectos")
    .update({ arquetipo })
    .eq("id", proyectoId);

  if (proyectoError) {
    return { error: "El triage se guardó, pero no se pudo actualizar el arquetipo del proyecto." };
  }

  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath("/proyectos");
  redirect(`/proyectos/${proyectoId}/triage/resultado`);
}
