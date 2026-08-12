"use server";

import { revalidatePath } from "next/cache";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import {
  accionMejoraSchema,
  cuantificacionImpactoSchema,
  estadoAccionMejoraSchema,
  estadoIniciativaSchema,
  iniciativaMejoraSchema,
  medicionImpactoSchema,
  type AccionMejoraInput,
  type CuantificacionImpactoInput,
  type EstadoAccionMejoraInput,
  type EstadoIniciativaInput,
  type IniciativaMejoraInput,
  type MedicionImpactoInput,
} from "@/lib/validations/mejora.schema";

function rutaMejoras(proyectoId: string) {
  return `/proyectos/${proyectoId}/mejoras`;
}

export async function obtenerPlanMejora(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();

  const [hallazgos, cuantificaciones, iniciativas, enlaces] = await Promise.all([
    supabase.from("hallazgos").select("*").eq("proyecto_id", proyectoId).order("impacto", { ascending: false }),
    supabase.from("cuantificaciones_impacto").select("*").eq("proyecto_id", proyectoId).order("created_at"),
    supabase.from("iniciativas_mejora").select("*").eq("proyecto_id", proyectoId).order("prioridad"),
    supabase.from("iniciativa_hallazgos").select("*").eq("proyecto_id", proyectoId),
  ]);

  const iniciativaIds = (iniciativas.data ?? []).map((iniciativa) => iniciativa.id);
  const [acciones, mediciones] = iniciativaIds.length
    ? await Promise.all([
        supabase.from("acciones_mejora").select("*").in("iniciativa_id", iniciativaIds).order("orden"),
        supabase.from("mediciones_impacto").select("*").in("iniciativa_id", iniciativaIds).order("fecha"),
      ])
    : [{ data: [] }, { data: [] }];

  return {
    hallazgos: hallazgos.data ?? [],
    cuantificaciones: cuantificaciones.data ?? [],
    iniciativas: iniciativas.data ?? [],
    enlaces: enlaces.data ?? [],
    acciones: acciones.data ?? [],
    mediciones: mediciones.data ?? [],
  };
}

export async function crearCuantificacionImpacto(input: CuantificacionImpactoInput) {
  const parsed = cuantificacionImpactoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const valor = parsed.data;
  const { error } = await supabase.from("cuantificaciones_impacto").insert({
    proyecto_id: valor.proyectoId,
    hallazgo_id: valor.hallazgoId,
    nombre: valor.nombre,
    tipo: valor.tipo,
    valor_unitario: valor.valorUnitario,
    volumen_periodo: valor.volumenPeriodo,
    periodos_anio: valor.periodosAnio,
    porcentaje_capturable: valor.porcentajeCapturable,
    moneda: valor.moneda,
    fuente_calculo: valor.fuenteCalculo,
    supuestos: valor.supuestos,
    confianza: valor.confianza,
    validado_cliente: valor.validadoCliente,
  });

  if (error) return { error: "No se pudo guardar la cuantificación. Verifica que el hallazgo pertenezca al proyecto." };
  revalidatePath(rutaMejoras(valor.proyectoId));
  revalidatePath("/lancelot");
  return { error: null };
}

export async function crearIniciativaMejora(input: IniciativaMejoraInput) {
  const parsed = iniciativaMejoraSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const valor = parsed.data;
  const hallazgoIds = [...new Set(valor.hallazgoIds)];
  const { data: hallazgos } = await supabase
    .from("hallazgos")
    .select("id")
    .eq("proyecto_id", valor.proyectoId)
    .in("id", hallazgoIds);

  if ((hallazgos ?? []).length !== hallazgoIds.length) {
    return { error: "Uno de los hallazgos no pertenece a este proyecto." };
  }

  const { data: iniciativa, error } = await supabase
    .from("iniciativas_mejora")
    .insert({
      proyecto_id: valor.proyectoId,
      titulo: valor.titulo,
      descripcion: valor.descripcion || null,
      hipotesis: valor.hipotesis,
      resultado_esperado: valor.resultadoEsperado,
      criterio_exito: valor.criterioExito,
      prioridad: valor.prioridad,
      responsable: valor.responsable || null,
      fecha_inicio: valor.fechaInicio || null,
      fecha_objetivo: valor.fechaObjetivo || null,
      inversion_estimada: valor.inversionEstimada,
      beneficio_anual_objetivo: valor.beneficioAnualObjetivo,
      moneda: valor.moneda,
    })
    .select("id")
    .single();

  if (error || !iniciativa) return { error: "No se pudo crear la iniciativa." };

  const { error: enlaceError } = await supabase.from("iniciativa_hallazgos").insert(
    hallazgoIds.map((hallazgoId) => ({
      proyecto_id: valor.proyectoId,
      iniciativa_id: iniciativa.id,
      hallazgo_id: hallazgoId,
    }))
  );

  if (enlaceError) {
    await supabase.from("iniciativas_mejora").delete().eq("id", iniciativa.id);
    return { error: "No se pudieron vincular los hallazgos; la iniciativa no fue creada." };
  }

  revalidatePath(rutaMejoras(valor.proyectoId));
  revalidatePath("/lancelot");
  return { error: null };
}

export async function crearAccionMejora(input: AccionMejoraInput) {
  const parsed = accionMejoraSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const valor = parsed.data;
  const { count } = await supabase
    .from("acciones_mejora")
    .select("id", { count: "exact", head: true })
    .eq("iniciativa_id", valor.iniciativaId);

  const { error } = await supabase.from("acciones_mejora").insert({
    iniciativa_id: valor.iniciativaId,
    orden: (count ?? 0) + 1,
    titulo: valor.titulo,
    descripcion: valor.descripcion || null,
    responsable: valor.responsable,
    fecha_objetivo: valor.fechaObjetivo || null,
  });

  if (error) return { error: "No se pudo guardar la acción." };
  revalidatePath(rutaMejoras(valor.proyectoId));
  revalidatePath("/lancelot");
  return { error: null };
}

export async function actualizarEstadoAccion(input: EstadoAccionMejoraInput) {
  const parsed = estadoAccionMejoraSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const valor = parsed.data;
  const { error } = await supabase.from("acciones_mejora").update({
    estado: valor.estado,
    evidencia_resultado: valor.evidenciaResultado || null,
    completada_at: valor.estado === "completada" ? new Date().toISOString() : null,
  }).eq("id", valor.accionId);

  if (error) return { error: "No se pudo actualizar la acción." };
  revalidatePath(rutaMejoras(valor.proyectoId));
  return { error: null };
}

export async function actualizarEstadoIniciativa(input: EstadoIniciativaInput) {
  const parsed = estadoIniciativaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const valor = parsed.data;
  const { error } = await supabase.from("iniciativas_mejora").update({ estado: valor.estado }).eq("id", valor.iniciativaId);
  if (error) return { error: "No se pudo actualizar la iniciativa." };
  revalidatePath(rutaMejoras(valor.proyectoId));
  return { error: null };
}

export async function crearMedicionImpacto(input: MedicionImpactoInput) {
  const parsed = medicionImpactoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const valor = parsed.data;
  const { error } = await supabase.from("mediciones_impacto").insert({
    iniciativa_id: valor.iniciativaId,
    tipo: valor.tipo,
    fecha: valor.fecha,
    beneficio_anual_realizado: valor.beneficioAnualRealizado,
    costo_acumulado: valor.costoAcumulado,
    valor_indicador: valor.valorIndicador,
    unidad_indicador: valor.unidadIndicador || null,
    fuente_datos: valor.fuenteDatos,
    observaciones: valor.observaciones || null,
    validado_cliente: valor.validadoCliente,
  });

  if (error) return { error: "No se pudo registrar la medición de impacto." };
  revalidatePath(rutaMejoras(valor.proyectoId));
  return { error: null };
}
