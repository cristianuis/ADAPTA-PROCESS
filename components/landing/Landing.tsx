import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TYPE_SCALE, SPACING_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const FASES = [
  {
    numero: 1,
    nombre: "Contextualización",
    descripcion: "Se levanta el diagnóstico real: triage, madurez PEMM, entrevistas y hallazgos validados.",
  },
  {
    numero: 2,
    nombre: "Definición",
    descripcion: "Se prioriza qué intervenir según impacto y esfuerzo, no por intuición.",
  },
  {
    numero: 3,
    nombre: "Arquitectura",
    descripcion: "Se rediseñan los procesos críticos: SIPOC, actividades, roles e indicadores.",
  },
  {
    numero: 4,
    nombre: "Pilotaje",
    descripcion: "Se implementa el rediseño en un alcance controlado antes de escalarlo.",
  },
  {
    numero: 5,
    nombre: "Transferencia",
    descripcion: "Se entrega el conocimiento y la operación al equipo del cliente.",
  },
  {
    numero: 6,
    nombre: "Anclaje",
    descripcion: "Se audita la adopción real en campo y se corrigen las desviaciones.",
  },
] as const;

const ARQUETIPOS = [
  {
    letra: "A",
    nombre: "Página en Blanco",
    descripcion: "No hay procesos documentados ni formalizados; se diseña una base operativa desde cero.",
  },
  {
    letra: "B",
    nombre: "Caos con Tracción",
    descripcion: "La operación crece, pero depende de personas — no de procesos definidos.",
  },
  {
    letra: "C",
    nombre: "Documentada pero Muerta",
    descripcion: "Existen manuales y flujos formales, pero nadie los sigue en el día a día.",
  },
  {
    letra: "D",
    nombre: "Optimización",
    descripcion: "Los procesos ya operan de forma estable; el reto es mejorar eficiencia e indicadores.",
  },
  {
    letra: "E",
    nombre: "Cumplimiento Forzado",
    descripcion: "El proyecto lo dispara un requisito externo con plazo: certificación, cliente o regulación.",
  },
] as const;

const FUNDAMENTOS = [
  {
    nombre: "Modelo de madurez PEMM (Hammer)",
    descripcion: "Evalúa los habilitadores de proceso y de empresa para ubicar el nivel real de madurez.",
  },
  {
    nombre: "Enfoque a procesos de ISO 9001:2015",
    descripcion: "Estructura de gestión por procesos, no por funciones o departamentos aislados.",
  },
  {
    nombre: "Cadena de valor",
    descripcion: "Distingue procesos estratégicos, misionales y de apoyo dentro de la operación.",
  },
  {
    nombre: "Gestión del cambio",
    descripcion: "La adopción real se audita en campo, no se asume por la existencia de un manual.",
  },
] as const;

function TopBar() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <span className={cn(TYPE_SCALE.h2)}>ADAPTA OS</span>
        <Button render={<Link href="/login">Iniciar sesión</Link>} />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col items-start px-4 py-16 sm:px-6 sm:py-20">
        {/* Tamaño de hero fuera de TYPE_SCALE a propósito: TYPE_SCALE no define un tamaño
            de display porque el dashboard interno nunca lo necesitó. Mismo peso y tracking
            que TYPE_SCALE.h1 (font-semibold tracking-tight), solo más grande. */}
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          El diagnóstico decide la ruta — no al revés.
        </h1>
        <p className={cn(TYPE_SCALE.body, "mt-5 max-w-xl text-base text-muted-foreground sm:text-lg")}>
          ADAPTA OS es la plataforma de consultoría en estructuración organizacional por procesos, basada en el
          Modelo ADAPTA.
        </p>
        <Button className="mt-8" render={<Link href="/login">Iniciar sesión</Link>} />
      </div>
    </section>
  );
}

function SeccionFases() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h2 className={TYPE_SCALE.h1}>Las 6 fases del Modelo ADAPTA</h2>
      <p className={cn(TYPE_SCALE.body, "mt-2 max-w-2xl text-muted-foreground")}>
        Un recorrido guiado, no un menú de opciones — cada fase habilita a la siguiente.
      </p>
      <div className={cn("mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", SPACING_SCALE.lg)}>
        {FASES.map((fase) => (
          <Card key={fase.numero}>
            <CardContent className="flex flex-col gap-2 pt-5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {fase.numero}
                </span>
                <span className={cn(TYPE_SCALE.h2)}>{fase.nombre}</span>
              </div>
              <p className={TYPE_SCALE.body}>{fase.descripcion}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SeccionArquetipos() {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className={TYPE_SCALE.h1}>Los 5 arquetipos de intervención</h2>
        <p className={cn(TYPE_SCALE.body, "mt-2 max-w-2xl text-muted-foreground")}>
          La ruta de trabajo cambia según el arquetipo detectado en el triage — no es la misma intervención para
          una empresa sin procesos que para una con procesos documentados que nadie sigue.
        </p>
        <div className={cn("mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", SPACING_SCALE.lg)}>
          {ARQUETIPOS.map((arq) => (
            <Card key={arq.letra}>
              <CardContent className="flex flex-col gap-2 pt-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary/40 text-xs font-semibold text-foreground">
                    {arq.letra}
                  </span>
                  <span className={cn(TYPE_SCALE.h2)}>{arq.nombre}</span>
                </div>
                <p className={TYPE_SCALE.body}>{arq.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeccionFundamento() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h2 className={TYPE_SCALE.h1}>Fundamento metodológico</h2>
      <p className={cn(TYPE_SCALE.body, "mt-2 max-w-2xl text-muted-foreground")}>
        La herramienta no inventa un método propio desde cero — combina marcos ya establecidos de gestión de
        procesos.
      </p>
      <dl className={cn("mt-8 grid grid-cols-1 sm:grid-cols-2", SPACING_SCALE.lg)}>
        {FUNDAMENTOS.map((f) => (
          <div key={f.nombre} className="border-l-2 border-border pl-4">
            <dt className={cn(TYPE_SCALE.h2)}>{f.nombre}</dt>
            <dd className={cn(TYPE_SCALE.body, "mt-1")}>{f.descripcion}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <p className={TYPE_SCALE.meta}>ADAPTA OS · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <main className="flex-1">
        <Hero />
        <SeccionFases />
        <SeccionArquetipos />
        <SeccionFundamento />
      </main>
      <Footer />
    </div>
  );
}
