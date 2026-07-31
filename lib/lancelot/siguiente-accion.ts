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
    titulo: "Evalúa la madurez de la empresa",
    descripcion: "Completa el PEMM de empresa para conocer las capacidades que sostienen sus procesos.",
    resultadoEsperado: "Nivel de madurez organizacional evaluado con evidencia.",
    cta: "Evaluar empresa",
  },
  4: {
    titulo: "Evalúa la madurez de los procesos",
    descripcion: "Aplica el PEMM a los procesos relevantes para detectar sus habilitadores más débiles.",
    resultadoEsperado: "Al menos un proceso evaluado y sus brechas visibles.",
    cta: "Evaluar procesos",
  },
  5: {
    titulo: "Recoge evidencia con entrevistas",
    descripcion: "Entrevista a las personas clave y analiza lo que ocurre realmente en la operación.",
    resultadoEsperado: "Entrevistas analizadas con señales y hallazgos propuestos.",
    cta: "Trabajar entrevistas",
  },
  6: {
    titulo: "Valida los hallazgos",
    descripcion: "Revisa las propuestas de Lancelot y conserva únicamente las que puedas sustentar.",
    resultadoEsperado: "Hallazgos verificables listos para priorizar.",
    cta: "Validar hallazgos",
  },
  7: {
    titulo: "Prioriza lo que realmente importa",
    descripcion: "Revisa la matriz de impacto y esfuerzo para decidir dónde intervenir primero.",
    resultadoEsperado: "Problemas prioritarios acordados para el diagnóstico.",
    cta: "Revisar prioridades",
  },
  8: {
    titulo: "Genera el informe de diagnóstico",
    descripcion: "Convierte la evidencia reunida en un entregable claro para tomar decisiones con el cliente.",
    resultadoEsperado: "Informe de diagnóstico generado y listo para presentar.",
    cta: "Generar diagnóstico",
  },
  9: {
    titulo: "Define procesos críticos y responsables",
    descripcion: "Selecciona los procesos que se intervendrán y asigna un dueño para cada uno.",
    resultadoEsperado: "Procesos críticos con responsables explícitos.",
    cta: "Definir procesos",
  },
  10: {
    titulo: "Diseña el proceso y cómo medirlo",
    descripcion: "Documenta SIPOC, actividades, responsabilidades e indicadores del proceso prioritario.",
    resultadoEsperado: "Proceso diseñado con operación y medición completas.",
    cta: "Diseñar proceso",
  },
  11: {
    titulo: "Genera el manual de procesos",
    descripcion: "Consolida el diseño aprobado en un documento utilizable por la empresa.",
    resultadoEsperado: "Manual de procesos generado para transferencia.",
    cta: "Generar manual",
  },
  12: {
    titulo: "Verifica que el proceso se adoptó",
    descripcion: "Audita casos reales para comprobar que el nuevo proceso se está usando como fue diseñado.",
    resultadoEsperado: "Nivel de adopción medido y desviaciones identificadas.",
    cta: "Auditar adopción",
  },
};

function hrefPaso(proyecto: ProyectoGuia, paso: number) {
  switch (paso) {
    case 1:
      return `/clientes/${proyecto.clienteId}`;
    case 2:
      return `/proyectos/${proyecto.id}/triage`;
    case 3:
    case 4:
      return `/proyectos/${proyecto.id}/pemm`;
    case 5:
      return `/proyectos/${proyecto.id}/entrevistas`;
    case 6:
    case 7:
      return `/proyectos/${proyecto.id}/hallazgos`;
    case 8:
    case 11:
      return `/proyectos/${proyecto.id}/entregables`;
    case 9:
    case 10:
      return `/proyectos/${proyecto.id}/procesos`;
    case 12:
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
        descripcion: "Los 12 pasos están completos. Revisa el resultado, documenta el aprendizaje y define el seguimiento con el cliente.",
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
