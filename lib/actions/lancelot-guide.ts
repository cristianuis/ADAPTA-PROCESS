"use server";

import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import {
  construirGuiaLancelot,
  type GuiaLancelot,
  type ProyectoGuia,
} from "@/lib/lancelot/siguiente-accion";

export async function obtenerGuiaLancelot(
  proyectoSeleccionadoId?: string | null
): Promise<GuiaLancelot> {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const [{ data: clientes }, { data: proyectos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, razon_social, created_at")
      .eq("consultor_id", consultor.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("proyectos")
      .select("id, cliente_id, nombre, estado_comercial, created_at, clientes(razon_social)")
      .eq("consultor_id", consultor.id)
      .neq("estado_comercial", "cerrado"),
  ]);

  const clientesGuia = (clientes ?? []).map((cliente) => ({
    id: cliente.id,
    nombre: cliente.razon_social,
    createdAt: cliente.created_at,
  }));
  const proyectoIds = (proyectos ?? []).map((proyecto) => proyecto.id);

  if (proyectoIds.length === 0) {
    return construirGuiaLancelot({
      clientes: clientesGuia,
      proyectos: [],
      proyectoSeleccionadoId,
    });
  }

  const [triage, pemm, entrevistas, hallazgos, entregables, procesos, auditorias] = await Promise.all([
    supabase.from("triage_respuestas").select("proyecto_id").in("proyecto_id", proyectoIds),
    supabase.from("pemm_evaluaciones").select("proyecto_id, tipo, estado").in("proyecto_id", proyectoIds),
    supabase.from("entrevistas").select("proyecto_id, hallazgos_ia").in("proyecto_id", proyectoIds),
    supabase.from("hallazgos").select("proyecto_id, origen").in("proyecto_id", proyectoIds),
    supabase.from("entregables").select("proyecto_id, tipo").in("proyecto_id", proyectoIds),
    supabase.from("procesos").select("id, proyecto_id, dueno_nombre").in("proyecto_id", proyectoIds),
    supabase.from("auditorias_adopcion").select("proyecto_id").in("proyecto_id", proyectoIds),
  ]);

  const procesosCriticos = (procesos.data ?? []).filter((proceso) => !!proceso.dueno_nombre);
  const procesosCriticosIds = procesosCriticos.map((proceso) => proceso.id);
  const [sipoc, actividades, indicadores] = procesosCriticosIds.length > 0
    ? await Promise.all([
        supabase.from("sipoc").select("proceso_id").in("proceso_id", procesosCriticosIds),
        supabase.from("actividades").select("proceso_id").in("proceso_id", procesosCriticosIds),
        supabase.from("indicadores").select("proceso_id, fuente_datos").in("proceso_id", procesosCriticosIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const procesosConSipoc = new Set((sipoc.data ?? []).map((fila) => fila.proceso_id));
  const procesosConActividades = new Set((actividades.data ?? []).map((fila) => fila.proceso_id));
  const procesosConIndicadores = new Set(
    (indicadores.data ?? [])
      .filter((fila) => fila.fuente_datos.trim().length > 0)
      .map((fila) => fila.proceso_id)
  );
  const proyectosConDisenoCompleto = new Set(
    procesosCriticos
      .filter(
        (proceso) =>
          procesosConSipoc.has(proceso.id) &&
          procesosConActividades.has(proceso.id) &&
          procesosConIndicadores.has(proceso.id)
      )
      .map((proceso) => proceso.proyecto_id)
  );

  const proyectosGuia: ProyectoGuia[] = (proyectos ?? []).map((proyecto) => {
    const id = proyecto.id;
    const tieneInforme = (entregables.data ?? []).some(
      (entregable) => entregable.proyecto_id === id && entregable.tipo === "diagnostico"
    );
    const tieneProcesosConDueno = procesosCriticos.some((proceso) => proceso.proyecto_id === id);
    const disenoCompleto = proyectosConDisenoCompleto.has(id);

    return {
      id,
      clienteId: proyecto.cliente_id,
      cliente: proyecto.clientes?.razon_social ?? "Empresa sin nombre",
      nombre: proyecto.nombre,
      estado: proyecto.estado_comercial,
      createdAt: proyecto.created_at,
      completitud: [
        !!proyecto.clientes?.razon_social,
        (triage.data ?? []).some((fila) => fila.proyecto_id === id),
        (pemm.data ?? []).some(
          (fila) => fila.proyecto_id === id && fila.tipo === "empresa" && fila.estado === "respondida"
        ),
        (pemm.data ?? []).some(
          (fila) => fila.proyecto_id === id && fila.tipo === "proceso" && fila.estado === "respondida"
        ),
        (entrevistas.data ?? []).some((fila) => fila.proyecto_id === id && fila.hallazgos_ia != null),
        (hallazgos.data ?? []).some((fila) => fila.proyecto_id === id && fila.origen === "ia"),
        tieneInforme,
        tieneInforme,
        tieneProcesosConDueno,
        disenoCompleto,
        (entregables.data ?? []).some(
          (entregable) => entregable.proyecto_id === id && entregable.tipo === "manual"
        ),
        (auditorias.data ?? []).some((auditoria) => auditoria.proyecto_id === id),
      ],
    };
  });

  return construirGuiaLancelot({
    clientes: clientesGuia,
    proyectos: proyectosGuia,
    proyectoSeleccionadoId,
  });
}
