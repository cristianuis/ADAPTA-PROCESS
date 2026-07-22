"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  pemmProcesoSchema,
  pemmEmpresaSchema,
  invitacionPemmSchema,
  respuestaPublicaPemmSchema,
  type PemmProcesoInput,
  type PemmEmpresaInput,
  type InvitacionPemmInput,
  type RespuestaPublicaPemmInput,
} from "@/lib/validations/pemm.schema";
import { calcularNivelResultante } from "@/lib/pemm/calcular-nivel";

export async function listarEvaluacionesPemm(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pemm_evaluaciones")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function obtenerEvaluacionPemm(id: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase.from("pemm_evaluaciones").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function crearEvaluacionPemmProceso(input: PemmProcesoInput) {
  const parsed = pemmProcesoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, procesoEvaluado, diseno, ejecutores, responsable, infraestructura, indicadores, evidencias } =
    parsed.data;

  const nivelResultante = calcularNivelResultante("proceso", {
    diseno,
    ejecutores,
    responsable,
    infraestructura,
    indicadores,
  });

  const { error } = await supabase.from("pemm_evaluaciones").insert({
    proyecto_id: proyectoId,
    tipo: "proceso",
    proceso_evaluado: procesoEvaluado,
    fuente: "consultor",
    estado: "respondida",
    diseno,
    ejecutores,
    responsable,
    infraestructura,
    indicadores,
    nivel_resultante: nivelResultante,
    evidencias: evidencias ?? {},
  });

  if (error) return { error: "No se pudo guardar la evaluación PEMM." };

  revalidatePath(`/proyectos/${proyectoId}/pemm`);
  redirect(`/proyectos/${proyectoId}/pemm`);
}

export async function crearEvaluacionPemmEmpresa(input: PemmEmpresaInput) {
  const parsed = pemmEmpresaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, liderazgo, cultura, experiencia, gobierno, evidencias } = parsed.data;

  const nivelResultante = calcularNivelResultante("empresa", { liderazgo, cultura, experiencia, gobierno });

  const { error } = await supabase.from("pemm_evaluaciones").insert({
    proyecto_id: proyectoId,
    tipo: "empresa",
    fuente: "consultor",
    estado: "respondida",
    liderazgo,
    cultura,
    experiencia,
    gobierno,
    nivel_resultante: nivelResultante,
    evidencias: evidencias ?? {},
  });

  if (error) return { error: "No se pudo guardar la evaluación PEMM." };

  revalidatePath(`/proyectos/${proyectoId}/pemm`);
  redirect(`/proyectos/${proyectoId}/pemm`);
}

export async function crearInvitacionPemm(input: InvitacionPemmInput) {
  const parsed = invitacionPemmSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { proyectoId, tipo, procesoEvaluado, respondienteNivel, respondienteNombre } = parsed.data;

  const { data, error } = await supabase
    .from("pemm_evaluaciones")
    .insert({
      proyecto_id: proyectoId,
      tipo,
      proceso_evaluado: procesoEvaluado || null,
      respondiente_nivel: respondienteNivel,
      respondiente_nombre: respondienteNombre || null,
      fuente: "encuesta_publica",
      estado: "pendiente",
      token: crypto.randomUUID(),
    })
    .select("token")
    .single();

  if (error || !data?.token) return { error: "No se pudo crear el enlace de encuesta." };

  revalidatePath(`/proyectos/${proyectoId}/pemm`);
  return { error: null, token: data.token };
}

/** Usado desde la página pública /encuesta/pemm/[token] — sin sesión de consultor. */
export async function obtenerPemmPorToken(token: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("pemm_evaluaciones").select("*").eq("token", token).maybeSingle();
  return data;
}

/** Usado desde la página pública /encuesta/pemm/[token] — sin sesión de consultor. */
export async function responderPemmPublico(input: RespuestaPublicaPemmInput) {
  const parsed = respuestaPublicaPemmSchema.safeParse(input);
  if (!parsed.success) return { error: "Respuesta inválida" };

  const supabase = await createClient();
  const { token, ...puntajes } = parsed.data;

  const { data: registro } = await supabase
    .from("pemm_evaluaciones")
    .select("tipo, estado")
    .eq("token", token)
    .maybeSingle();

  if (!registro) return { error: "Enlace no válido o ya expiró." };
  if (registro.estado === "respondida") return { error: "Esta encuesta ya fue respondida." };

  const nivelResultante = calcularNivelResultante(registro.tipo, puntajes);

  const { error } = await supabase
    .from("pemm_evaluaciones")
    .update({ ...puntajes, nivel_resultante: nivelResultante, estado: "respondida" })
    .eq("token", token);

  if (error) return { error: "No se pudo guardar tu respuesta. Intenta de nuevo." };
  return { error: null };
}

export interface ComparativaPemm {
  dimension: string;
  direccion: number | null;
  mando_medio: number | null;
  operacion: number | null;
}

/** Compara percepción entre niveles jerárquicos — la discrepancia es en sí un hallazgo. */
export async function obtenerComparativaPemm(proyectoId: string) {
  const evaluaciones = await listarEvaluacionesPemm(proyectoId);
  const respondidas = evaluaciones.filter((e) => e.estado === "respondida" && e.respondiente_nivel);

  const dimensiones =
    respondidas[0]?.tipo === "empresa"
      ? (["liderazgo", "cultura", "experiencia", "gobierno"] as const)
      : (["diseno", "ejecutores", "responsable", "infraestructura", "indicadores"] as const);

  const niveles = ["direccion", "mando_medio", "operacion"] as const;

  return dimensiones.map((dim) => {
    const fila: ComparativaPemm = { dimension: dim, direccion: null, mando_medio: null, operacion: null };
    for (const nivel of niveles) {
      const delNivel = respondidas.filter((e) => e.respondiente_nivel === nivel);
      const valores = delNivel.map((e) => e[dim]).filter((v): v is number => typeof v === "number");
      if (valores.length > 0) {
        fila[nivel] = Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2));
      }
    }
    return fila;
  });
}
