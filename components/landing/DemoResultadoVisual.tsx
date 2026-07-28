"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  Sparkles,
  Target,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const DIMENSIONES = [
  {
    nombre: "Documentación",
    corto: "Docs",
    riesgo: [
      "El conocimiento crítico puede perderse o variar entre personas.",
      "La documentación parcial todavía deja decisiones a la memoria.",
      "La base documental existe; conviene validar vigencia y uso real.",
    ],
    accion: "Identificar los procesos críticos y documentar primero sus puntos de decisión.",
  },
  {
    nombre: "Adopción",
    corto: "Adopción",
    riesgo: [
      "La experiencia del cliente y el resultado dependen de quién ejecuta.",
      "El proceso definido compite con hábitos informales.",
      "La consistencia es una fortaleza que puede convertirse en estándar.",
    ],
    accion: "Contrastar el proceso diseñado con la forma real de trabajar.",
  },
  {
    nombre: "Medición",
    corto: "Medición",
    riesgo: [
      "Sin datos confiables, los problemas aparecen cuando ya son urgentes.",
      "Las mediciones informales no permiten distinguir síntomas de causas.",
      "Hay una base de datos útil; el reto es conectarla con decisiones.",
    ],
    accion: "Definir pocos indicadores con fuente, frecuencia, responsable y sentido.",
  },
  {
    nombre: "Responsables",
    corto: "Roles",
    riesgo: [
      "Las brechas pueden quedar sin dueño y resolverse por escalamiento.",
      "La responsabilidad informal funciona hasta que cambian las personas.",
      "La propiedad del proceso está clara y puede sostener la mejora.",
    ],
    accion: "Asignar dueño de proceso y aclarar decisiones, límites y escalamiento.",
  },
  {
    nombre: "Decisiones",
    corto: "Decisión",
    riesgo: [
      "La operación reacciona a incendios en lugar de prevenirlos.",
      "La estructura parcial produce decisiones distintas ante casos similares.",
      "La toma de decisiones tiene una estructura aprovechable y escalable.",
    ],
    accion: "Diseñar una rutina breve para revisar señales, decidir y cerrar acciones.",
  },
] as const;

const PERFIL = {
  dependencia_operativa: {
    etiqueta: "Dependencia operativa",
    titulo: "La operación depende más de personas clave que de un sistema.",
    descripcion:
      "El principal riesgo no es la falta de esfuerzo: es que el conocimiento, las decisiones y el control todavía viven en pocas personas.",
  },
  transicion_operativa: {
    etiqueta: "Transición operativa",
    titulo: "Ya existe estructura, pero todavía no funciona como un solo sistema.",
    descripcion:
      "Hay prácticas valiosas y señales de orden. La oportunidad está en conectar documentación, responsables, medición y adopción.",
  },
  sistema_en_desarrollo: {
    etiqueta: "Sistema en desarrollo",
    titulo: "La base es sólida; ahora hay que demostrar adopción y mejora sostenida.",
    descripcion:
      "Los elementos esenciales existen. El siguiente nivel es verificar que funcionen en la práctica y produzcan decisiones mejores.",
  },
} as const;

type PerfilResultado = keyof typeof PERFIL;

interface DemoResultadoVisualProps {
  perfil: PerfilResultado;
  puntaje: number;
  respuestas: number[];
  empresa: string;
  nombre: string;
}

export function DemoResultadoVisual({
  perfil,
  puntaje,
  respuestas,
  empresa,
  nombre,
}: DemoResultadoVisualProps) {
  const contenido = PERFIL[perfil];
  const porcentaje = puntaje * 10;
  const primerNombre = nombre.trim().split(/\s+/)[0] || "Tu equipo";
  const datos = DIMENSIONES.map((dimension, indice) => {
    const nivel = respuestas[indice] ?? 0;
    return {
      ...dimension,
      nivel,
      actual: nivel * 50,
      referencia: 100,
      brecha: (2 - nivel) * 50,
    };
  });
  const ordenadas = [...datos].sort(
    (a, b) => a.actual - b.actual || DIMENSIONES.indexOf(a) - DIMENSIONES.indexOf(b)
  );
  const prioridad = ordenadas[0];
  const fortaleza = [...datos].sort(
    (a, b) => b.actual - a.actual || DIMENSIONES.indexOf(a) - DIMENSIONES.indexOf(b)
  )[0];
  const asunto = encodeURIComponent(`Lectura estratégica de procesos — ${empresa}`);
  const cuerpo = encodeURIComponent(
    `Hola Cristian,\n\nCompleté el pulso operativo de ${empresa} y obtuve ${porcentaje}/100. Quiero profundizar la lectura y priorizar el siguiente movimiento.\n\n${nombre}`
  );

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#163f8c]/15 bg-white shadow-2xl shadow-[#163f8c]/10">
      <div className="bg-[#0a1c40] p-6 text-white sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9fb9df]">
              Informe ejecutivo preliminar
            </p>
            <p className="mt-2 text-sm text-[#f2e8d5]">
              {empresa} · preparado para {primerNombre}
            </p>
          </div>
          <span className="rounded-full bg-[#f2e8d5] px-3 py-1.5 text-xs font-semibold text-[#163f8c]">
            {contenido.etiqueta}
          </span>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              {contenido.titulo}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#c3d2e7] sm:text-base sm:leading-7">
              {contenido.descripcion}
            </p>
          </div>
          <div
            className="grid size-36 shrink-0 place-items-center rounded-full p-3 sm:size-40"
            style={{
              background: `conic-gradient(#f2e8d5 ${porcentaje * 3.6}deg, #315da8 0deg)`,
            }}
            role="img"
            aria-label={`Índice de sistematización ${porcentaje} de 100`}
          >
            <div className="grid size-full place-items-center rounded-full bg-[#0a1c40] text-center">
              <div>
                <p className="font-mono text-4xl font-semibold text-white">{porcentaje}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#9fb9df]">
                  de 100
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 bg-[#f8f4ea] p-5 sm:p-8 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="min-w-0 rounded-3xl border border-[#163f8c]/10 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315da8]">
                Mapa de capacidad
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#0a1c40]">
                Cinco dimensiones del sistema operativo
              </h3>
            </div>
            <span className="rounded-full bg-[#eef3fb] px-3 py-1 text-[11px] text-[#315da8]">
              Referencia metodológica
            </span>
          </div>

          <div className="mt-4 h-72 min-w-0 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={datos}
                outerRadius="60%"
                margin={{ top: 20, right: 20, bottom: 12, left: 20 }}
              >
                <PolarGrid stroke="#d9dfeb" />
                <PolarAngleAxis
                  dataKey="corto"
                  tick={{ fill: "#53647d", fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const punto = payload[0].payload as (typeof datos)[number];
                    return (
                      <div className="max-w-64 rounded-xl border border-[#163f8c]/15 bg-white p-3 text-xs shadow-lg">
                        <p className="font-semibold text-[#0a1c40]">{punto.nombre}</p>
                        <p className="mt-1 text-[#53647d]">
                          Capacidad observada: {punto.actual}/100
                        </p>
                      </div>
                    );
                  }}
                />
                <Radar
                  name="Referencia"
                  dataKey="referencia"
                  stroke="#d2c09e"
                  fill="#f2e8d5"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Resultado"
                  dataKey="actual"
                  stroke="#163f8c"
                  strokeWidth={3}
                  fill="#2456b3"
                  fillOpacity={0.42}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-[#53647d]">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#163f8c]" />
              Resultado declarado
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#d2c09e]" />
              Operación sistematizada
            </span>
          </div>
        </article>

        <article className="rounded-3xl border border-[#163f8c]/10 bg-white p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315da8]">
            Lectura por dimensión
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#0a1c40]">
            Dónde está hoy la capacidad
          </h3>
          <div className="mt-7 space-y-5">
            {datos.map((dimension) => (
              <div key={dimension.nombre}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[#0a1c40]">{dimension.nombre}</span>
                  <span className="font-mono text-xs text-[#53647d]">
                    {dimension.actual}/100
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-[#e8edf5]"
                  role="img"
                  aria-label={`${dimension.nombre}: ${dimension.actual} de 100`}
                >
                  <div
                    className="h-full rounded-full bg-[#2456b3]"
                    style={{ width: `${Math.max(dimension.actual, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-[#163f8c]/10 pt-5 text-xs leading-5 text-[#71809a]">
            Esta referencia representa el nivel metodológico ideal de la muestra; no es
            un benchmark sectorial ni reemplaza la validación con evidencia.
          </p>
        </article>
      </div>

      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-3 sm:px-8 sm:pb-8">
        <article className="rounded-3xl bg-[#fff6e5] p-5">
          <AlertTriangle className="size-5 text-[#a45c10]" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#a45c10]">
            Riesgo principal
          </p>
          <h3 className="mt-2 font-semibold text-[#0a1c40]">{prioridad.nombre}</h3>
          <p className="mt-2 text-sm leading-6 text-[#53647d]">
            {prioridad.riesgo[prioridad.nivel]}
          </p>
        </article>

        <article className="rounded-3xl bg-[#eef3fb] p-5">
          <CheckCircle2 className="size-5 text-[#2456b3]" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#315da8]">
            Fortaleza visible
          </p>
          <h3 className="mt-2 font-semibold text-[#0a1c40]">{fortaleza.nombre}</h3>
          <p className="mt-2 text-sm leading-6 text-[#53647d]">
            {fortaleza.riesgo[fortaleza.nivel]}
          </p>
        </article>

        <article className="rounded-3xl bg-[#0a1c40] p-5 text-white">
          <Target className="size-5 text-[#f2e8d5]" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#9fb9df]">
            Prioridad recomendada
          </p>
          <h3 className="mt-2 font-semibold">{prioridad.nombre}</h3>
          <p className="mt-2 text-sm leading-6 text-[#c3d2e7]">{prioridad.accion}</p>
        </article>
      </div>

      <div className="border-t border-[#163f8c]/10 p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[#315da8]">
              <Sparkles className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Esto es solo la muestra
              </p>
            </div>
            <h3 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] text-[#0a1c40] sm:text-3xl">
              El diagnóstico completo explica por qué ocurre y qué conviene transformar primero.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#53647d]">
              Contrastamos esta percepción con entrevistas, evidencia, madurez, hallazgos
              y datos del proceso para construir una ruta defendible.
            </p>
          </div>
          <a
            href={`mailto:cristianalfonso2501@gmail.com?subject=${asunto}&body=${cuerpo}`}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#163f8c] px-7 text-sm font-semibold text-white hover:bg-[#2456b3]"
          >
            <Mail className="size-4" />
            Solicitar lectura estratégica
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
