import { PASOS_RECORRIDO } from "@/lib/proyectos/recorrido-guiado";
import type { FocoLancelot, HorizonteLancelot } from "@/lib/lancelot/types";

export interface ClienteGuia {
  id: string;
  nombre: string;
  createdAt: string;
}

export interface ProyectoGuia {
  id: string;
  clienteId: string;
  cliente: string;
  nombre: string;
  estado: "prospecto" | "contratado" | "pausado" | "cerrado";
  createdAt: string;
  completitud: boolean[];
}

export type TipoAccionGuia =
  | "registrar_empresa"
  | "crear_proyecto"
  | "continuar_recorrido"
  | "proyecto_completo";

export interface AccionGuia {
  tipo: TipoAccionGuia;
  titulo: string;
  descripcion: string;
  resultadoEsperado: string;
  href: string;
  cta: string;
  objetivoIa: string | null;
  focoIa: FocoLancelot;
  horizonteIa: HorizonteLancelot;
  proyectoId: string | null;
  proyectoNombre: string | null;
  clienteNombre: string | null;
  pasoActual: number;
  pasosTotales: number;
  pasosCompletos: number;
}

export interface GuiaLancelot {
  accion: AccionGuia;
  proyectos: ProyectoGuia[];
  clientesSinProyecto: ClienteGuia[];
}

const CONTENIDO_PASOS: Record<
  number,
  Pick<AccionGuia, "titulo" | "descripcion" | "resultadoEsperado" | "cta">
> = {
  1: {
    titulo: "Completa los datos de la empresa",
    descripcion: "Deja lista la información básica y el contacto principal antes de diagnosticar.",
    resultadoEsperado: "Empresa y persona de contacto claramente identificadas.",
    cta: "Completar empresa",
  },
  2: {
    titulo: "Haz el triage inicial",
    descripcion: "Responde las seis preguntas que definen el punto de partida y el alcance del trabajo.",
    resultadoEsperado: "Arquetipo de intervención y alertas iniciales definidos.",
    cta: "Hacer triage",
  },
  3: {
    titulo: "Entrevista a quienes hacen el trabajo",
    descripcion: "Registra cómo se ejecuta el proceso, incluidos traspasos, excepciones y fuentes. No necesitas IA para avanzar.",
    resultadoEsperado: "Al menos una entrevista respondida y documentada.",
    cta: "Registrar entrevista",
  },
  4: {
    titulo: "Dibuja el proceso tal como ocurre hoy",
    descripcion: "Define dueño, alcance, SIPOC y actividades AS-IS antes de proponer soluciones.",
    resultadoEsperado: "Un proceso con dueño, SIPOC y secuencia real de actividades.",
    cta: "Levantar AS-IS",
  },
  5: {
    titulo: "Evalúa la madurez de la empresa",
    descripcion: "Aplica PEMM para conocer capacidades organizacionales; no lo confundas con un índice global.",
    resultadoEsperado: "PEMM de empresa respondido con nivel y dimensiones.",
    cta: "Evaluar empresa",
  },
  6: {
    titulo: "Evalúa la madurez del proceso",
    descripcion: "Aplica PEMM al proceso observado para distinguir brechas de diseño, ejecución e infraestructura.",
    resultadoEsperado: "PEMM de proceso respondido.",
    cta: "Evaluar proceso",
  },
  7: {
    titulo: "Valida problemas con evidencia",
    descripcion: "Revisa las propuestas de NEXUS y conserva solo hallazgos sustentados en cita, documento, observación o dato.",
    resultadoEsperado: "Al menos un hallazgo revisado y trazable.",
    cta: "Revisar hallazgos",
  },
  8: {
    titulo: "Prioriza y arma un plan ejecutable",
    descripcion: "Vincula la iniciativa al hallazgo, define criterio de éxito, responsable y al menos una acción.",
    resultadoEsperado: "Una iniciativa trazable con acción, dueño y plazo.",
    cta: "Crear plan de mejora",
  },
  9: {
    titulo: "Diseña el proceso TO-BE",
    descripcion: "Conserva el AS-IS y documenta los pasos futuros. Cada cambio debe enlazar un hallazgo revisado.",
    resultadoEsperado: "Diseño futuro validado por consultor con criterio de piloto.",
    cta: "Diseñar TO-BE",
  },
  10: {
    titulo: "Define cómo medir y transferir",
    descripcion: "Crea al menos un indicador con fuente y sentido y genera el manual de procesos.",
    resultadoEsperado: "Indicador verificable y manual para el equipo.",
    cta: "Preparar medición y manual",
  },
  11: {
    titulo: "Prueba la adopción con casos reales",
    descripcion: "Audita si el proceso diseñado se está usando y registra desviaciones observadas.",
    resultadoEsperado: "Auditoría de adopción con casos y hallazgos de uso.",
    cta: "Auditar adopción",
  },
  12: {
    titulo: "Entrega el Informe 360°",
    descripcion: "Integra evidencia, madurez, AS-IS, TO-BE, indicadores y roadmap en un documento revisado por ti.",
    resultadoEsperado: "Informe 360° descargable, con pendientes y límites explícitos.",
    cta: "Preparar Informe 360°",
  },
};

function hrefPaso(proyecto: ProyectoGuia, paso: number) {
  switch (paso) {
    case 1:
      return `/clientes/${proyecto.clienteId}`;
    case 2:
      return `/proyectos/${proyecto.id}/triage`;
    case 3:
      return `/proyectos/${proyecto.id}/entrevistas`;
    case 4:
    case 9:
      return `/proyectos/${proyecto.id}/procesos`;
    case 5:
    case 6:
      return `/proyectos/${proyecto.id}/pemm`;
    case 7:
      return `/proyectos/${proyecto.id}/hallazgos`;
    case 8:
      return `/proyectos/${proyecto.id}/mejoras`;
    case 10:
    case 12:
      return `/proyectos/${proyecto.id}/entregables`;
    case 11:
      return `/proyectos/${proyecto.id}/adopcion`;
    default:
      return `/proyectos/${proyecto.id}`;
  }
}

function prioridadEstado(estado: ProyectoGuia["estado"]) {
  if (estado === "contratado") return 0;
  if (estado === "prospecto") return 1;
  if (estado === "pausado") return 2;
  return 3;
}

export function ordenarProyectosParaEnfoque(proyectos: ProyectoGuia[]) {
  return [...proyectos]
    .filter((proyecto) => proyecto.estado !== "cerrado")
    .sort((a, b) => {
      const porEstado = prioridadEstado(a.estado) - prioridadEstado(b.estado);
      if (porEstado !== 0) return porEstado;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export function construirGuiaLancelot({
  clientes,
  proyectos,
  proyectoSeleccionadoId,
}: {
  clientes: ClienteGuia[];
  proyectos: ProyectoGuia[];
  proyectoSeleccionadoId?: string | null;
}): GuiaLancelot {
  const proyectosOrdenados = ordenarProyectosParaEnfoque(proyectos);
  const idsConProyecto = new Set(proyectos.map((proyecto) => proyecto.clienteId));
  const clientesSinProyecto = clientes.filter((cliente) => !idsConProyecto.has(cliente.id));
  const seleccionado = proyectoSeleccionadoId
    ? proyectosOrdenados.find((proyecto) => proyecto.id === proyectoSeleccionadoId)
    : null;
  const proyecto = seleccionado ?? proyectosOrdenados[0] ?? null;

  if (!proyecto && clientesSinProyecto.length > 0) {
    const cliente = clientesSinProyecto[0];
    return {
      proyectos: proyectosOrdenados,
      clientesSinProyecto,
      accion: {
        tipo: "crear_proyecto",
        titulo: `Abre el trabajo para ${cliente.nombre}`,
        descripcion: "La empresa ya está registrada. Ahora crea el proyecto que organizará todo el diagnóstico.",
        resultadoEsperado: "Proyecto creado y recorrido de trabajo habilitado.",
        href: `/proyectos/nuevo?clienteId=${cliente.id}`,
        cta: "Crear proyecto",
        objetivoIa: null,
        focoIa: "entrega",
        horizonteIa: "hoy",
        proyectoId: null,
        proyectoNombre: null,
        clienteNombre: cliente.nombre,
        pasoActual: 0,
        pasosTotales: PASOS_RECORRIDO.length,
        pasosCompletos: 0,
      },
    };
  }

  if (!proyecto) {
    return {
      proyectos: proyectosOrdenados,
      clientesSinProyecto,
      accion: {
        tipo: "registrar_empresa",
        titulo: "Registra la empresa que acaba de llegar",
        descripcion: "Empieza por guardar la información esencial de la empresa y su contacto principal.",
        resultadoEsperado: "Empresa creada y lista para abrir su proyecto de diagnóstico.",
        href: "/clientes/nuevo",
        cta: "Registrar empresa",
        objetivoIa: null,
        focoIa: "comercial",
        horizonteIa: "hoy",
        proyectoId: null,
        proyectoNombre: null,
        clienteNombre: null,
        pasoActual: 0,
        pasosTotales: PASOS_RECORRIDO.length,
        pasosCompletos: 0,
      },
    };
  }

  const completitud = PASOS_RECORRIDO.map((_, index) => !!proyecto.completitud[index]);
  const pasosCompletos = completitud.filter(Boolean).length;
  const indicePendiente = completitud.findIndex((completo) => !completo);

  if (indicePendiente === -1) {
    return {
      proyectos: proyectosOrdenados,
      clientesSinProyecto,
      accion: {
        tipo: "proyecto_completo",
        titulo: `Cierra el ciclo con ${proyecto.cliente}`,
        descripcion: "Los 12 pasos están completos. Revisa el Informe 360°, documenta el aprendizaje y define el seguimiento con el cliente.",
        resultadoEsperado: "Resultado del proyecto revisado y siguiente conversación preparada.",
        href: `/proyectos/${proyecto.id}`,
        cta: "Revisar proyecto",
        objetivoIa: "Preparar el cierre y seguimiento de un proyecto despues de completar su recorrido metodologico.",
        focoIa: "entrega",
        horizonteIa: "semana",
        proyectoId: proyecto.id,
        proyectoNombre: proyecto.nombre,
        clienteNombre: proyecto.cliente,
        pasoActual: PASOS_RECORRIDO.length,
        pasosTotales: PASOS_RECORRIDO.length,
        pasosCompletos,
      },
    };
  }

  const paso = indicePendiente + 1;
  const contenido = CONTENIDO_PASOS[paso];
  return {
    proyectos: proyectosOrdenados,
    clientesSinProyecto,
    accion: {
      tipo: "continuar_recorrido",
      ...contenido,
      href: hrefPaso(proyecto, paso),
      objetivoIa: `Preparar y ejecutar el paso ${paso} de ${PASOS_RECORRIDO.length}, ${PASOS_RECORRIDO[indicePendiente].nombre}. Resultado esperado: ${contenido.resultadoEsperado}`,
      focoIa: "entrega",
      horizonteIa: "hoy",
      proyectoId: proyecto.id,
      proyectoNombre: proyecto.nombre,
      clienteNombre: proyecto.cliente,
      pasoActual: paso,
      pasosTotales: PASOS_RECORRIDO.length,
      pasosCompletos,
    },
  };
}
