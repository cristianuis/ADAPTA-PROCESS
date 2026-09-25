import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { evaluarPreparacionInforme360 } from "@/lib/documentos/evaluar-informe-360";
import { hallazgoConSoporteRevisado } from "@/lib/evidencia/hallazgo-con-soporte";

export async function cargarDatosInforme360(proyectoId: string) {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { data: proyecto, error: proyectoError } = await supabase.from("proyectos")
    .select("*").eq("id", proyectoId).maybeSingle();
  if (proyectoError) throw new Error("No se pudo consultar el proyecto.");
  if (!proyecto) return null;
  const { data: cliente, error: clienteError } = await supabase.from("clientes")
    .select("*").eq("id", proyecto.cliente_id).maybeSingle();
  if (clienteError || !cliente) throw new Error("No se pudo consultar la empresa del proyecto.");

  const [triageR, pemmR, entrevistasR, hallazgosR, procesosR, iniciativasR] = await Promise.all([
    supabase.from("triage_respuestas").select("*").eq("proyecto_id", proyectoId).maybeSingle(),
    supabase.from("pemm_evaluaciones").select("*").eq("proyecto_id", proyectoId),
    supabase.from("entrevistas").select("id, entrevistado_nombre, entrevistado_cargo, fecha, estado, transcripcion").eq("proyecto_id", proyectoId),
    supabase.from("hallazgos").select("*").eq("proyecto_id", proyectoId).order("impacto", { ascending: false }),
    supabase.from("procesos").select("*").eq("proyecto_id", proyectoId).order("prioridad"),
    supabase.from("iniciativas_mejora").select("*").eq("proyecto_id", proyectoId).order("prioridad"),
  ]);
  if ([triageR, pemmR, entrevistasR, hallazgosR, procesosR, iniciativasR].some((r) => r.error)) {
    throw new Error("No se pudieron consultar todos los datos del Informe 360.");
  }
  const procesos = procesosR.data ?? [];
  const iniciativas = iniciativasR.data ?? [];
  const procesoIds = procesos.map((p) => p.id);
  const iniciativaIds = iniciativas.map((i) => i.id);

  const [actividadesR, sipocR, indicadoresR, disenosR, accionesR, enlacesR, medicionesR] = await Promise.all([
    procesoIds.length ? supabase.from("actividades").select("*").in("proceso_id", procesoIds).order("orden") : Promise.resolve({ data: [], error: null }),
    procesoIds.length ? supabase.from("sipoc").select("*").in("proceso_id", procesoIds) : Promise.resolve({ data: [], error: null }),
    procesoIds.length ? supabase.from("indicadores").select("*").in("proceso_id", procesoIds) : Promise.resolve({ data: [], error: null }),
    supabase.from("disenos_tobe").select("*").eq("proyecto_id", proyectoId),
    iniciativaIds.length ? supabase.from("acciones_mejora").select("*").in("iniciativa_id", iniciativaIds).order("orden") : Promise.resolve({ data: [], error: null }),
    supabase.from("iniciativa_hallazgos").select("*").eq("proyecto_id", proyectoId),
    iniciativaIds.length ? supabase.from("mediciones_impacto").select("*").in("iniciativa_id", iniciativaIds).order("fecha") : Promise.resolve({ data: [], error: null }),
  ]);
  if ([actividadesR, sipocR, indicadoresR, disenosR, accionesR, enlacesR, medicionesR].some((r) => r.error)) {
    throw new Error("No se pudieron consultar los procesos o el plan de mejora.");
  }
  const disenos = disenosR.data ?? [];
  const disenoIds = disenos.map((d) => d.id);
  const pasosR = disenoIds.length
    ? await supabase.from("pasos_tobe").select("*").in("diseno_id", disenoIds).order("orden")
    : { data: [], error: null };
  if (pasosR.error) throw new Error("No se pudieron consultar los pasos TO-BE.");

  const actividades = actividadesR.data ?? [];
  const indicadores = indicadoresR.data ?? [];
  const acciones = accionesR.data ?? [];
  const hallazgos = hallazgosR.data ?? [];
  const hallazgosRevisados = new Set(hallazgos.filter(hallazgoConSoporteRevisado).map((h) => h.id));
  const cobertura = {
    entrevistas: (entrevistasR.data ?? []).filter((e) => e.estado === "respondida" && !!e.transcripcion?.trim()).length,
    evaluacionesPemmRespondidas: (pemmR.data ?? []).filter((p) => p.estado === "respondida").length,
    hallazgosRevisados: hallazgosRevisados.size,
    procesosConActividades: procesos.filter((p) => !!p.dueno_nombre?.trim() && actividades.some((a) => a.proceso_id === p.id) && (sipocR.data ?? []).some((s) => s.proceso_id === p.id)).length,
    disenosTobeValidados: disenos.filter((d) => d.estado === "validado" && (pasosR.data ?? []).some((s) => s.diseno_id === d.id && !!s.hallazgo_id && hallazgosRevisados.has(s.hallazgo_id))).length,
    indicadores: indicadores.length,
    iniciativasConAcciones: iniciativas.filter((i) => acciones.some((a) => a.iniciativa_id === i.id) && (enlacesR.data ?? []).some((e) => e.iniciativa_id === i.id && hallazgosRevisados.has(e.hallazgo_id))).length,
  };

  return {
    consultor, cliente, proyecto,
    triage: triageR.data,
    evaluacionesPemm: pemmR.data ?? [],
    entrevistas: entrevistasR.data ?? [],
    hallazgos,
    procesos, actividades, sipoc: sipocR.data ?? [], indicadores, disenos, pasos: pasosR.data ?? [],
    iniciativas, acciones, enlaces: enlacesR.data ?? [], mediciones: medicionesR.data ?? [],
    cobertura,
    preparacion: evaluarPreparacionInforme360(cobertura),
  };
}

export type DatosInforme360 = NonNullable<Awaited<ReturnType<typeof cargarDatosInforme360>>>;
