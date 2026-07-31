import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ExternalLink,
  FileCheck2,
  MessageCircle,
  Workflow,
} from "lucide-react";

const FASES = [
  ["01", "Contextualizar", "Entender la operación real antes de proponer."],
  ["02", "Definir", "Priorizar con evidencia, impacto y esfuerzo."],
  ["03", "Diseñar", "Convertir el diagnóstico en procesos claros."],
  ["04", "Pilotear", "Probar en pequeño antes de escalar."],
  ["05", "Transferir", "Dejar capacidad instalada en el equipo."],
  ["06", "Anclar", "Medir adopción y corregir desviaciones."],
] as const;

const PRINCIPIOS = [
  "Diagnóstico antes que soluciones",
  "Procesos que se usan, no documentos que se archivan",
  "Indicadores con fuente, sentido y responsable",
] as const;

export function PortfolioHeader({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#163f8c]/10 bg-[#f5f1e7]/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex items-center gap-3" aria-label="Ir al inicio">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#163f8c] text-sm font-semibold text-[#f2e8d5]">
            CA
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold tracking-tight text-[#163f8c]">Cristian Alfonso</span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#5d6e87]">Procesos & sistemas</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-[#425675] md:flex" aria-label="Navegación principal">
          <Link href="/#sobre-mi" className="hover:text-[#163f8c]">Sobre mí</Link>
          <Link href="/#metodo" className="hover:text-[#163f8c]">Método</Link>
          <Link href="/diagnostico" className="hover:text-[#163f8c]">Diagnóstico</Link>
          <Link href="/herramientas" className="hover:text-[#163f8c]">Herramientas</Link>
          <Link href="/consultoria" className="hover:text-[#163f8c]">Consultoría</Link>
        </nav>

        <Link
          href={authenticated ? "/lancelot" : "/login"}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#163f8c] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2456b3]"
        >
          {authenticated ? "Abrir Lancelot" : "Ingresar a mi empresa"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}

function Hero({ authenticated }: { authenticated: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-[#163f8c]/10 bg-[#f5f1e7]">
      <div className="absolute inset-y-0 right-0 hidden w-[44%] bg-[#163f8c] lg:block" aria-hidden />
      <div className="absolute left-[52%] top-24 hidden size-64 rounded-full bg-[#f2e8d5]/15 blur-3xl lg:block" aria-hidden />
      <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:py-24">
        <div>
          <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#405d88]">
            <span className="h-px w-9 bg-[#315da8]" />
            Consultoría de procesos + herramientas digitales
          </p>
          <h1 className="max-w-4xl text-[clamp(3rem,7vw,6.8rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-[#163f8c]">
            Procesos que funcionan cuando nadie está mirando.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#53647d] sm:text-xl">
            Soy Cristian Alfonso. Ayudo a convertir operaciones dependientes de personas en sistemas claros,
            medibles y sostenibles.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/diagnostico"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#163f8c] px-6 text-sm font-semibold text-white hover:bg-[#2456b3]"
            >
              Probar diagnóstico
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/herramientas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#163f8c]/25 px-6 text-sm font-semibold text-[#163f8c] hover:bg-white/60"
            >
              Ver herramientas
              <ExternalLink className="size-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[#74839a]">
            Diagnóstico · Diseño · Medición · Adopción
          </p>
        </div>

        <div className="relative lg:pl-12">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#0d2554] p-5 text-white shadow-2xl shadow-[#081733]/30 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c5d2e3]">Sistema de mejora</p>
                <p className="mt-1 font-semibold">De la evidencia a la adopción</p>
              </div>
              <span className="rounded-full bg-[#f2e8d5] px-3 py-1 text-xs font-semibold text-[#163f8c]">En marcha</span>
            </div>

            <div className="my-7 grid grid-cols-3 gap-2">
              {[
                ["12", "pasos guiados"],
                ["06", "fases"],
                ["01", "ruta clara"],
              ].map(([valor, etiqueta]) => (
                <div key={etiqueta} className="rounded-2xl bg-white/[0.06] p-4">
                  <p className="text-2xl font-semibold text-[#f2e8d5]">{valor}</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#b7c6dc]">{etiqueta}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                [Workflow, "Arquitectura de procesos", "Estructura"],
                [BarChart3, "Indicadores con sentido", "Medición"],
                [FileCheck2, "Adopción verificable", "Resultado"],
              ].map(([Icon, titulo, etiqueta]) => {
                const ItemIcon = Icon as typeof Workflow;
                return (
                  <div key={titulo as string} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e8d5]/10 text-[#f2e8d5]">
                      <ItemIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{titulo as string}</span>
                      <span className="block text-xs text-[#9fb2cd]">{etiqueta as string}</span>
                    </span>
                    <Check className="size-4 text-[#f2e8d5]" />
                  </div>
                );
              })}
            </div>

            <Link
              href={authenticated ? "/lancelot" : "/consultoria"}
              className="mt-7 flex min-h-12 items-center justify-between rounded-2xl bg-[#f2e8d5] px-5 text-sm font-semibold text-[#163f8c]"
            >
              {authenticated ? "Abrir Lancelot" : "Solicitar consultoría especializada"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="sobre-mi" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#315da8]">Sobre mí</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#163f8c] sm:text-5xl">
            Consultoría con criterio técnico y sentido práctico.
          </h2>
        </div>
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-5 text-lg leading-8 text-[#53647d]">
            <p>
              Trabajo con empresas que crecieron más rápido que sus procesos, que tienen procedimientos que nadie
              usa o que necesitan estructurar su operación sin perder agilidad.
            </p>
            <p>
              Mi enfoque une análisis de procesos, diseño organizacional, datos y tecnología. No parto de una
              plantilla: primero entiendo el contexto y después construyo la ruta de intervención.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {PRINCIPIOS.map((principio, indice) => (
              <li key={principio} className="border-t border-[#163f8c]/20 pt-4 text-sm leading-6 text-[#314c74]">
                <span className="mb-2 block font-mono text-xs text-[#315da8]">0{indice + 1}</span>
                {principio}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Method() {
  return (
    <section id="metodo" className="scroll-mt-24 bg-[#163f8c] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2e8d5]">Método Lancelot</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Una ruta guiada desde el diagnóstico hasta la adopción.
            </h2>
          </div>
          <p className="max-w-xl self-end text-lg leading-8 text-[#c3d2e7]">
            Cada fase responde una pregunta distinta y deja evidencia para habilitar la siguiente. Así la mejora
            deja de depender de intuiciones aisladas.
          </p>
        </div>

        <div className="mt-14 grid border-l border-t border-white/15 sm:grid-cols-2 lg:grid-cols-3">
          {FASES.map(([numero, nombre, descripcion]) => (
            <article key={numero} className="min-h-52 border-b border-r border-white/15 p-6 sm:p-7">
              <span className="font-mono text-xs text-[#f2e8d5]">{numero}</span>
              <h3 className="mt-10 text-xl font-semibold">{nombre}</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[#aebed5]">{descripcion}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LancelotToolCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#163f8c]/15 bg-[#163f8c] text-white shadow-xl shadow-[#163f8c]/10">
      <div className={`grid ${compact ? "lg:grid-cols-[1fr_0.8fr]" : "lg:grid-cols-[0.9fr_1.1fr]"}`}>
        <div className="flex flex-col justify-between p-7 sm:p-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#f2e8d5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#163f8c]">
                Disponible
              </span>
              <span className="text-xs text-[#aebed5]">Herramienta propia</span>
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#f2e8d5]">Lancelot</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
              Tu mano derecha para vender, diagnosticar y mejorar con trazabilidad.
            </h3>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#c3d2e7]">
              Diagnóstico PEMM, entrevistas, hallazgos, arquitectura, indicadores y adopción reunidos en un recorrido
              metodológico de 12 pasos.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/consultoria"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f2e8d5] px-6 text-sm font-semibold text-[#163f8c] hover:bg-white"
            >
              Solicitar consultoría especializada
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/diagnostico"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/10"
            >
              Ver muestra
              <ExternalLink className="size-4" />
            </Link>
          </div>
        </div>

        <div className="m-4 min-h-80 rounded-[1.4rem] border border-white/10 bg-[#0a1c40] p-5 sm:m-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex gap-1.5" aria-hidden>
              <span className="size-2 rounded-full bg-[#f2e8d5]" />
              <span className="size-2 rounded-full bg-white/25" />
              <span className="size-2 rounded-full bg-white/25" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#8299ba]">Recorrido guiado</span>
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["01", "Contexto y diagnóstico", "100%"],
              ["02", "Hallazgos validados", "100%"],
              ["03", "Arquitectura de procesos", "72%"],
              ["04", "Pilotaje y adopción", "28%"],
            ].map(([numero, titulo, avance]) => (
              <div key={numero} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl bg-white/[0.05] p-4">
                <span className="font-mono text-xs text-[#f2e8d5]">{numero}</span>
                <span className="text-sm">{titulo}</span>
                <span className="text-xs text-[#8da3c1]">{avance}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function Tools() {
  return (
    <section id="herramientas" className="bg-[#f5f1e7] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#315da8]">Herramientas</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-[#163f8c] sm:text-5xl">
              Tecnología construida desde el trabajo real.
            </h2>
          </div>
          <Link href="/herramientas" className="inline-flex items-center gap-2 text-sm font-semibold text-[#163f8c]">
            Ver todas
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <LancelotToolCard />
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contacto" className="scroll-mt-24 bg-[#f2e8d5] py-20 sm:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-5 sm:px-8 lg:flex-row lg:items-end lg:px-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#244c91]">Contacto</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#163f8c] sm:text-6xl">
            ¿Tu empresa creció más rápido que sus procesos?
          </h2>
        </div>
        <Link
          href="/consultoria"
          className="inline-flex min-h-14 shrink-0 items-center gap-3 rounded-full bg-[#163f8c] px-7 text-sm font-semibold text-white hover:bg-[#2456b3]"
        >
          <MessageCircle className="size-4" />
          Solicitar consultoría especializada
        </Link>
      </div>
    </section>
  );
}

export function PortfolioFooter() {
  return (
    <footer className="bg-[#0a1c40] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div>
          <p className="text-sm font-semibold">Cristian Alfonso</p>
          <p className="mt-1 text-xs text-[#91a7c5]">Consultoría de procesos y herramientas digitales</p>
        </div>
        <p className="text-xs text-[#7189aa]">© {new Date().getFullYear()} · Construido en GitHub, desplegado en Vercel</p>
      </div>
    </footer>
  );
}

export function Landing({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <div className="min-h-screen bg-[#f5f1e7]">
      <PortfolioHeader authenticated={authenticated} />
      <main>
        <Hero authenticated={authenticated} />
        <About />
        <Method />
        <Tools />
        <Contact />
      </main>
      <PortfolioFooter />
    </div>
  );
}
