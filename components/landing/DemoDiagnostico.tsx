"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  completarDemoDiagnostico,
  iniciarDemoDiagnostico,
} from "@/lib/actions/demo-diagnostico";

const PREGUNTAS = [
  {
    titulo: "¿Qué tan documentados están los procesos críticos?",
    opciones: ["No están documentados", "Hay documentos parciales", "Están claros y vigentes"],
  },
  {
    titulo: "¿La forma definida de trabajar se usa realmente?",
    opciones: ["Cada persona lo hace distinto", "Se sigue algunas veces", "Se sigue de forma consistente"],
  },
  {
    titulo: "¿Se mide el desempeño con datos confiables?",
    opciones: ["No hay indicadores", "Hay mediciones informales", "Hay indicadores con fuente definida"],
  },
  {
    titulo: "¿Cada proceso tiene un responsable claro?",
    opciones: ["La responsabilidad es difusa", "Hay responsables informales", "Hay dueños formalmente definidos"],
  },
  {
    titulo: "¿Las decisiones operativas siguen una estructura conocida?",
    opciones: ["Dependen de apagar incendios", "La estructura es parcial", "La estructura es clara y respetada"],
  },
] as const;

const RESULTADOS = {
  dependencia_operativa: {
    etiqueta: "Dependencia operativa",
    titulo: "La operación depende demasiado de personas clave.",
    descripcion:
      "El conocimiento vive principalmente en la experiencia individual. El primer paso no es documentar todo, sino identificar los procesos críticos y sus puntos de dependencia.",
    siguiente: "Empezar por contexto, responsables y evidencia real.",
  },
  transicion_operativa: {
    etiqueta: "Transición operativa",
    titulo: "Ya existe estructura, pero todavía no funciona como sistema.",
    descripcion:
      "Hay prácticas y documentos útiles, aunque su aplicación y medición aún son inconsistentes. La oportunidad está en conectar responsables, indicadores y rutina operativa.",
    siguiente: "Priorizar brechas y convertir prácticas aisladas en un recorrido común.",
  },
  sistema_en_desarrollo: {
    etiqueta: "Sistema en desarrollo",
    titulo: "Tienes una base sólida; el reto es sostenerla y mejorarla.",
    descripcion:
      "Los elementos esenciales existen. El siguiente nivel consiste en validar adopción, detectar desviaciones y usar datos para mejorar sin añadir burocracia.",
    siguiente: "Auditar adopción y cerrar el ciclo de mejora.",
  },
} as const;

type PerfilResultado = keyof typeof RESULTADOS;

export function DemoDiagnostico() {
  const [isPending, startTransition] = useTransition();
  const [paso, setPaso] = useState<"datos" | "preguntas" | "resultado">("datos");
  const [token, setToken] = useState<string | null>(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<(number | null)[]>(
    Array(PREGUNTAS.length).fill(null)
  );
  const [resultado, setResultado] = useState<{
    perfil: PerfilResultado;
    puntaje: number;
  } | null>(null);
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    empresa: "",
    consentimiento: false,
    sitioWeb: "",
  });

  function iniciar(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const respuesta = await iniciarDemoDiagnostico(datos);
      if (respuesta.error || !respuesta.token) {
        toast.error(respuesta.error);
        return;
      }
      setToken(respuesta.token);
      setPaso("preguntas");
    });
  }

  function responder(valor: number) {
    const nuevas = [...respuestas];
    nuevas[preguntaActual] = valor;
    setRespuestas(nuevas);

    if (preguntaActual < PREGUNTAS.length - 1) {
      setPreguntaActual((actual) => actual + 1);
    }
  }

  function calcularResultado() {
    if (!token || respuestas.some((respuesta) => respuesta == null)) return;

    startTransition(async () => {
      const respuesta = await completarDemoDiagnostico({
        token,
        respuestas: respuestas as number[],
      });
      if (respuesta.error || !respuesta.resultado) {
        toast.error(respuesta.error);
        return;
      }
      setResultado({
        perfil: respuesta.resultado.perfil as PerfilResultado,
        puntaje: respuesta.resultado.puntaje,
      });
      setPaso("resultado");
    });
  }

  if (paso === "resultado" && resultado) {
    const contenido = RESULTADOS[resultado.perfil];
    return (
      <div className="overflow-hidden rounded-[2rem] border border-[#163f8c]/15 bg-white shadow-2xl shadow-[#163f8c]/10">
        <div className="bg-[#0a1c40] p-7 text-white sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-[#f2e8d5] px-3 py-1 text-xs font-semibold text-[#163f8c]">
              {contenido.etiqueta}
            </span>
            <span className="font-mono text-sm text-[#c3d2e7]">{resultado.puntaje}/10</span>
          </div>
          <h2 className="mt-8 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            {contenido.titulo}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#c3d2e7]">
            {contenido.descripcion}
          </p>
        </div>
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315da8]">
              Siguiente movimiento
            </p>
            <p className="mt-3 max-w-xl text-lg font-medium text-[#163f8c]">
              {contenido.siguiente}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#53647d]">
              Este pulso es orientativo. El diagnóstico completo contrasta entrevistas,
              madurez, hallazgos y evidencia del proceso.
            </p>
          </div>
          <a
            href="mailto:cristianalfonso2501@gmail.com?subject=Quiero%20profundizar%20mi%20diagnóstico%20de%20procesos"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#163f8c] px-6 text-sm font-semibold text-white hover:bg-[#2456b3]"
          >
            <Mail className="size-4" />
            Profundizar el diagnóstico
          </a>
        </div>
      </div>
    );
  }

  if (paso === "preguntas") {
    const pregunta = PREGUNTAS[preguntaActual];
    const completadas = respuestas.filter((respuesta) => respuesta != null).length;
    return (
      <div className="rounded-[2rem] border border-[#163f8c]/15 bg-white p-6 shadow-2xl shadow-[#163f8c]/10 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315da8]">
            Pulso operativo
          </p>
          <span className="font-mono text-xs text-[#7189aa]">
            {preguntaActual + 1}/{PREGUNTAS.length}
          </span>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#edf1f7]">
          <div
            className="h-full rounded-full bg-[#163f8c]"
            style={{ width: `${((preguntaActual + 1) / PREGUNTAS.length) * 100}%` }}
          />
        </div>

        <h2 className="mt-8 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#163f8c] sm:text-4xl">
          {pregunta.titulo}
        </h2>

        <div className="mt-8 grid gap-3">
          {pregunta.opciones.map((opcion, indice) => {
            const seleccionada = respuestas[preguntaActual] === indice;
            return (
              <button
                key={opcion}
                type="button"
                onClick={() => responder(indice)}
                className={`flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm transition-colors sm:text-base ${
                  seleccionada
                    ? "border-[#163f8c] bg-[#eef3fb] text-[#163f8c]"
                    : "border-[#163f8c]/15 text-[#53647d] hover:border-[#163f8c]/40"
                }`}
              >
                <span>{opcion}</span>
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${
                    seleccionada
                      ? "border-[#163f8c] bg-[#163f8c] text-white"
                      : "border-[#163f8c]/20"
                  }`}
                >
                  {seleccionada ? <Check className="size-4" /> : indice + 1}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={preguntaActual === 0}
            onClick={() => setPreguntaActual((actual) => Math.max(0, actual - 1))}
            className="text-sm font-medium text-[#53647d] disabled:opacity-30"
          >
            Anterior
          </button>
          {completadas === PREGUNTAS.length && (
            <button
              type="button"
              disabled={isPending}
              onClick={calcularResultado}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#163f8c] px-6 text-sm font-semibold text-white hover:bg-[#2456b3] disabled:opacity-60"
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Ver mi resultado
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={iniciar}
      className="rounded-[2rem] border border-[#163f8c]/15 bg-white p-6 shadow-2xl shadow-[#163f8c]/10 sm:p-10"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315da8]">
        Comienza aquí
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#163f8c]">
        Recibe tu pulso operativo.
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#53647d]">
        Cinco preguntas. Menos de tres minutos. Sin abrir el sistema interno.
      </p>

      <div className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
          Nombre
          <input
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={datos.nombre}
            onChange={(event) => setDatos({ ...datos, nombre: event.target.value })}
            className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none focus:border-[#163f8c]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
          Correo
          <input
            required
            type="email"
            maxLength={254}
            autoComplete="email"
            value={datos.email}
            onChange={(event) => setDatos({ ...datos, email: event.target.value })}
            className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none focus:border-[#163f8c]"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
          Empresa
          <input
            required
            minLength={2}
            maxLength={140}
            autoComplete="organization"
            value={datos.empresa}
            onChange={(event) => setDatos({ ...datos, empresa: event.target.value })}
            className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none focus:border-[#163f8c]"
          />
        </label>
        <label className="absolute -left-[9999px]" aria-hidden="true">
          Sitio web
          <input
            tabIndex={-1}
            autoComplete="off"
            value={datos.sitioWeb}
            onChange={(event) => setDatos({ ...datos, sitioWeb: event.target.value })}
          />
        </label>
        <label className="flex items-start gap-3 text-xs leading-5 text-[#53647d]">
          <input
            required
            type="checkbox"
            checked={datos.consentimiento}
            onChange={(event) =>
              setDatos({ ...datos, consentimiento: event.target.checked })
            }
            className="mt-1 size-4 accent-[#163f8c]"
          />
          Autorizo el uso de estos datos para recibir el resultado y ser contactado
          acerca de un diagnóstico de procesos.
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#163f8c] px-6 text-sm font-semibold text-white hover:bg-[#2456b3] disabled:opacity-60"
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Iniciar diagnóstico
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
