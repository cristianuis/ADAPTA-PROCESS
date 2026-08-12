"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  History,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LancelotCompactBrief } from "@/components/lancelot/LancelotCompactBrief";
import type { GuiaLancelot } from "@/lib/lancelot/siguiente-accion";
import { respuestaLancelotSchema } from "@/lib/lancelot/types";
import type {
  RespuestaLancelot,
  SesionLancelot,
  SesionLancelotResumen,
} from "@/lib/lancelot/types";

interface Props {
  guiaInicial: GuiaLancelot;
  sesiones: SesionLancelotResumen[];
  sesionInicial: SesionLancelot | null;
}

const RESULTADOS_RAPIDOS = ["Funcionó", "Avancé parcialmente", "Me bloquearon", "No lo hice"];

export function LancelotGuide({ guiaInicial, sesiones, sesionInicial }: Props) {
  const router = useRouter();
  const ultimaVuelta = sesionInicial?.vueltas.at(-1) ?? null;
  const guia = guiaInicial;
  const [sesionId, setSesionId] = useState(sesionInicial?.id ?? "");
  const [salida, setSalida] = useState<RespuestaLancelot | null>(ultimaVuelta?.salida ?? null);
  const [resultadoRapido, setResultadoRapido] = useState("");
  const [detalle, setDetalle] = useState("");
  const [cargando, setCargando] = useState(false);

  const { accion } = guia;
  const porcentaje = Math.round((accion.pasosCompletos / accion.pasosTotales) * 100);

  function cambiarProyecto(proyectoId: string) {
    router.push(proyectoId ? `/lancelot?proyecto=${proyectoId}` : "/lancelot");
  }

  async function pedirPreparacion(esContinuacion: boolean) {
    if (!esContinuacion && !accion.objetivoIa) return;
    if (esContinuacion && !resultadoRapido) {
      toast.error("Elige qué pasó para que Lancelot pueda ajustar el plan.");
      return;
    }

    setCargando(true);
    try {
      const retroalimentacion = [resultadoRapido, detalle.trim()].filter(Boolean).join(": ");
      const response = await fetch("/api/ia/lancelot-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(esContinuacion
          ? { sesionId, retroalimentacion }
          : {
              objetivo: accion.objetivoIa,
              foco: accion.focoIa,
              horizonte: accion.horizonteIa,
              proyectoId: accion.proyectoId,
            }),
      });
      const data: unknown = await response.json();
      if (!response.ok || typeof data !== "object" || !data) throw new Error("No se pudo preparar el paso.");
      const envelope = data as { error?: string; sesionId?: string; salida?: unknown };
      if (envelope.error) throw new Error(envelope.error);
      const parsed = respuestaLancelotSchema.safeParse(envelope.salida);
      if (!parsed.success || !envelope.sesionId) throw new Error("La respuesta llegó incompleta.");

      setSesionId(envelope.sesionId);
      setSalida(parsed.data);
      setResultadoRapido("");
      setDetalle("");
      toast.success(esContinuacion ? "Plan ajustado con lo que ocurrió." : "Paso preparado.");
      router.replace(`/lancelot?sesion=${envelope.sesionId}`, { scroll: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lancelot no pudo responder.");
    } finally {
      setCargando(false);
    }
  }

  if (salida) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Apoyo para el paso actual</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Lancelot te ayuda a ejecutarlo</h1>
          </div>
          <Button variant="outline" render={<Link href="/lancelot">Volver a mi siguiente paso</Link>} />
        </div>

        <LancelotCompactBrief salida={salida} />

        <Card>
          <CardHeader>
            <CardTitle>Después de intentarlo, ¿qué pasó?</CardTitle>
            <p className="text-sm text-muted-foreground">Una respuesta basta. Lancelot ajustará el apoyo sin hacerte llenar otro formulario.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {RESULTADOS_RAPIDOS.map((resultado) => (
                <button
                  type="button"
                  key={resultado}
                  onClick={() => setResultadoRapido(resultado)}
                  className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors ${resultadoRapido === resultado ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/50"}`}
                >
                  {resultadoRapido === resultado && <Check className="mr-1 inline size-4" />}{resultado}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lancelot-detalle">Detalle opcional</Label>
              <Textarea
                id="lancelot-detalle"
                value={detalle}
                onChange={(event) => setDetalle(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Ej. El gerente aceptó la reunión, pero pidió involucrar primero al jefe de operaciones."
              />
            </div>
            <div className="flex justify-end">
              <Button size="lg" disabled={cargando} onClick={() => pedirPreparacion(true)}>
                {cargando ? <><Loader2 className="animate-spin" />Ajustando…</> : <>Actualizar mi plan<ArrowRight /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">
              <Sparkles className="size-4" />Tu guía de trabajo
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Haz esto ahora</h1>
            <p className="mt-3 max-w-xl leading-7 text-primary-foreground/75">
              Una empresa a la vez, un paso a la vez. Lancelot revisa lo que ya hiciste y te lleva al siguiente punto.
            </p>
          </div>
          {guia.proyectos.length > 0 && (
            <div className="min-w-0 sm:min-w-64">
              <Label htmlFor="lancelot-proyecto" className="text-primary-foreground/70">Empresa o proyecto activo</Label>
              <select
                id="lancelot-proyecto"
                value={accion.proyectoId ?? ""}
                onChange={(event) => cambiarProyecto(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-primary-foreground"
              >
                {guia.proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id} className="text-foreground">
                    {proyecto.cliente} · {proyecto.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="overflow-hidden border-primary/25 shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {accion.pasoActual > 0 ? `Paso ${accion.pasoActual} de ${accion.pasosTotales}` : "Punto de partida"}
                </p>
                {accion.clienteNombre && <p className="mt-1 text-sm text-muted-foreground">{accion.clienteNombre}{accion.proyectoNombre ? ` · ${accion.proyectoNombre}` : ""}</p>}
              </div>
              {accion.tipo === "proyecto_completo" && (
                <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-4" />Recorrido completo
                </span>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${porcentaje}%` }} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-7">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{accion.titulo}</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{accion.descripcion}</p>
            </div>

            <div className="rounded-xl border-l-4 border-l-secondary bg-secondary/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sabrás que terminaste cuando</p>
              <p className="mt-1 font-medium">{accion.resultadoEsperado}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" render={<Link href={accion.href}>{accion.cta}<ArrowRight /></Link>} />
              {accion.objetivoIa && (
                <Button size="lg" variant="outline" disabled={cargando} onClick={() => pedirPreparacion(false)}>
                  {cargando ? <><Loader2 className="animate-spin" />Preparando…</> : <><Sparkles />Ayúdame a preparar este paso</>}
                </Button>
              )}
            </div>

            {accion.proyectoId && (
              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">¿Ya registraste el resultado en el módulo?</p>
                <Button variant="ghost" onClick={() => router.refresh()}><RefreshCw />Verificar y mostrar el siguiente</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-0">
              <p className="flex items-center gap-2 font-semibold"><Building2 className="size-4 text-primary" />¿Llegó otra empresa?</p>
              <p className="text-sm leading-6 text-muted-foreground">Regístrala primero. Lancelot la pondrá en la ruta sin mezclarla con el trabajo actual.</p>
              <Button variant="outline" className="w-full" render={<Link href="/clientes/nuevo"><Plus />Registrar empresa</Link>} />
            </CardContent>
          </Card>

          {guia.clientesSinProyecto.length > 0 && accion.tipo !== "crear_proyecto" && (
            <Card className="border-amber-500/30">
              <CardContent className="pt-0">
                <p className="text-sm font-semibold">{guia.clientesSinProyecto.length} empresa(s) sin proyecto</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">No se pierden: quedan esperando hasta que termines tu prioridad actual.</p>
              </CardContent>
            </Card>
          )}

          <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-4 shrink-0" />La guía básica no usa IA ni consume tokens. Solo se activa cuando pides ayuda para preparar un paso.
          </p>
        </aside>
      </div>

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-medium">
          <span className="flex items-center gap-2"><History className="size-4 text-primary" />Planes anteriores</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-2 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
          {sesiones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no has pedido ayuda para preparar un paso.</p>
          ) : sesiones.map((sesion) => (
            <Link key={sesion.id} href={`/lancelot?sesion=${sesion.id}`} className="rounded-lg border p-3 hover:border-primary">
              <p className="line-clamp-2 text-sm font-medium">{sesion.objetivo}</p>
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
