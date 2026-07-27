"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  entrevistaSchema,
  validarHallazgoSchema,
  invitacionAutoservicioSchema,
  respuestaAutoservicioSchema,
  type EntrevistaInput,
  type ValidarHallazgoInput,
  type InvitacionAutoservicioInput,
  type RespuestaAutoservicioInput,
} from "@/lib/validations/entrevista.schema";
import { construirTranscripcionAutoservicio } from "@/lib/entrevistas/construir-transcripcion-autoservicio";

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

/** Personas ya registradas en este proyecto (de entrevistas previas), para precargar
 * nombre/cargo al generar un enlace de autoservicio en vez de escribirlos de nuevo. */
export async function listarEntrevistadosRegistrados(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("entrevistas")
    .select("entrevistado_nombre, entrevistado_cargo")
    .eq("proyecto_id", proyectoId)
    .not("entrevistado_nombre", "is", null);

  const vistos = new Set<string>();
  const resultado: { nombre: string; cargo: string | null }[] = [];
  for (const e of data ?? []) {
    if (!e.entrevistado_nombre || vistos.has(e.entrevistado_nombre)) continue;
    vistos.add(e.entrevistado_nombre);
    resultado.push({ nombre: e.entrevistado_nombre, cargo: e.entrevistado_cargo });
  }
  return resultado;
}

/** Crea el enlace público de intake de autoservicio (Bloque 3) — mismo patrón de
 * token que crearInvitacionPemm en lib/actions/pemm.ts. */
export async function crearInvitacionAutoservicio(input: InvitacionAutoservicioInput) {
  const parsed = invitacionAutoservicioSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, entrevistadoNombre, entrevistadoCargo } = parsed.data;

  const { data, error } = await supabase
    .from("entrevistas")
    .insert({
      proyecto_id: proyectoId,
      entrevistado_nombre: entrevistadoNombre || null,
      entrevistado_cargo: entrevistadoCargo || null,
      origen: "autoservicio",
      estado: "pendiente",
      token: crypto.randomUUID(),
    })
    .select("token")
    .single();

  if (error || !data?.token) return { error: "No se pudo crear el enlace de autoservicio." };

  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath(`/proyectos/${proyectoId}/entrevistas`);
  return { error: null, token: data.token };
}

/** Usado desde la página pública /encuesta/proceso/[token] — sin sesión de consultor. */
export async function obtenerIntakePorToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("obtener_intake_publico", { p_token: token });
  if (error) return null;
  return data[0] ?? null;
}

/** Usado desde la página pública /encuesta/proceso/[token] — sin sesión de consultor.
 * Compone las 4 respuestas como transcripción y la guarda igual que una entrevista
 * dirigida, para que pase por el mismo pipeline de análisis de IA sin cambios. */
export async function responderIntakeAutoservicio(input: RespuestaAutoservicioInput) {
  const parsed = respuestaAutoservicioSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Respuesta inválida" };

  const supabase = await createClient();
  const { token, entrevistadoNombre, entrevistadoCargo, ...respuestas } = parsed.data;

  const transcripcion = construirTranscripcionAutoservicio(respuestas);
  const { data, error } = await supabase.rpc("responder_intake_publico", {
    p_token: token,
    p_entrevistado_nombre: entrevistadoNombre,
    p_entrevistado_cargo: entrevistadoCargo,
    p_transcripcion: transcripcion,
  });

  if (error || !data) return { error: "Enlace no válido, ya usado o respuesta incompleta." };
  return { error: null };
}
