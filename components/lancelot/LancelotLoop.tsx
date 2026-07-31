"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrainCircuit, History, LockKeyhole, Plus, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LancelotBrief } from "@/components/lancelot/LancelotBrief";
import { respuestaLancelotSchema } from "@/lib/lancelot/types";
import type {
  FocoLancelot,
  HorizonteLancelot,
  ProyectoLancelot,
  RespuestaLancelot,
  SesionLancelot,
  SesionLancelotResumen,
} from "@/lib/lancelot/types";

const ETAPAS = ["Observar", "Diagnosticar", "Decidir", "Ejecutar", "Verificar", "Aprender"];
const FOCO_LABEL: Record<FocoLancelot, string> = { comercial: "Vender", entrega: "Entregar", sistema: "Fortalecer el sistema" };

interface Props {
  proyectos: ProyectoLancelot[];
  sesiones: SesionLancelotResumen[];
  sesionInicial: SesionLancelot | null;
}

export function LancelotLoop({ proyectos, sesiones, sesionInicial }: Props) {
  const router = useRouter();
  const ultimaVuelta = sesionInicial?.vueltas.at(-1) ?? null;
  const [objetivo, setObjetivo] = useState(sesionInicial?.objetivo ?? "");
  const [foco, setFoco] = useState<FocoLancelot>(sesionInicial?.foco ?? "comercial");
  const [horizonte, setHorizonte] = useState<HorizonteLancelot>(sesionInicial?.horizonte ?? "semana");
  const [proyectoId, setProyectoId] = useState(sesionInicial?.proyecto_id ?? "");
  const [sesionId, setSesionId] = useState(sesionInicial?.id ?? "");
  const [numero, setNumero] = useState(ultimaVuelta?.numero ?? 0);
  const [salida, setSalida] = useState<RespuestaLancelot | null>(ultimaVuelta?.salida ?? null);
  const [retroalimentacion, setRetroalimentacion] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ejecutarLoop(esContinuacion: boolean) {
    if (!esContinuacion && objetivo.trim().length < 12) {
      toast.error("Describe un resultado concreto de al menos 12 caracteres.");
      return;
    }
    if (esContinuacion && retroalimentacion.trim().length < 3) {
      toast.error("Cuéntale a Lancelot qué ocurrió antes de continuar.");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch("/api/ia/lancelot-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(esContinuacion
          ? { sesionId, retroalimentacion }
          : { objetivo, foco, horizonte, proyectoId: proyectoId || null }),
      });
      const data: unknown = await response.json();
      if (!response.ok || typeof data !== "object" || !data) {
        throw new Error("No se pudo completar la vuelta.");
      }
      const envelope = data as { error?: string; sesionId?: string; numero?: number; salida?: unknown };
      if (envelope.error) throw new Error(envelope.error);
      const parsed = respuestaLancelotSchema.safeParse(envelope.salida);
      if (!parsed.success || !envelope.sesionId || !envelope.numero) throw new Error("La respuesta llegó incompleta.");

      setSesionId(envelope.sesionId);
      setNumero(envelope.numero);
      setSalida(parsed.data);
      setRetroalimentacion("");
      toast.success(esContinuacion ? "Nueva vuelta completada." : "Misión creada con memoria privada.");
      router.replace(`/lancelot?sesion=${envelope.sesionId}`, { scroll: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lancelot no pudo responder.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-6">
        <section className="overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65"><Sparkles className="size-4" />Tu mano derecha operativa</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Lancelot Loop</h1>
              <p className="mt-3 max-w-xl leading-7 text-primary-foreground/75">Convierte la realidad de tu portafolio en una prioridad, acciones verificables y aprendizaje para la siguiente vuelta.</p>
            </div>
            {sesionId && <Button variant="secondary" render={<Link href="/lancelot"><Plus />Nueva misión</Link>} />}
          </div>
          <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/15 sm:grid-cols-6">
            {ETAPAS.map((etapa, index) => <div key={etapa} className="bg-primary/80 px-2 py-3 text-center"><span className="block font-mono text-[10px] text-primary-foreground/50">0{index + 1}</span><span className="mt-1 block text-xs font-medium">{etapa}</span></div>)}
          </div>
        </section>

        {!salida ? (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="size-5 text-primary" />Define la misión</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="lancelot-objetivo">¿Qué resultado concreto quieres conseguir?</Label>
                <Textarea id="lancelot-objetivo" value={objetivo} onChange={(event) => setObjetivo(event.target.value)} maxLength={600} rows={4} placeholder="Ej. Conseguir una reunión de diagnóstico pagado con una empresa de servicios esta semana." />
                <p className="text-xs text-muted-foreground">Escribe el resultado, no una lista de tareas.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label htmlFor="lancelot-foco">Foco</Label><select id="lancelot-foco" value={foco} onChange={(event) => setFoco(event.target.value as FocoLancelot)} className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="comercial">Vender</option><option value="entrega">Entregar</option><option value="sistema">Fortalecer sistema</option></select></div>
                <div className="space-y-2"><Label htmlFor="lancelot-horizonte">Horizonte</Label><select id="lancelot-horizonte" value={horizonte} onChange={(event) => setHorizonte(event.target.value as HorizonteLancelot)} className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="hoy">Hoy</option><option value="semana">Esta semana</option><option value="mes">Este mes</option></select></div>
                <div className="space-y-2"><Label htmlFor="lancelot-proyecto">Contexto</Label><select id="lancelot-proyecto" value={proyectoId} onChange={(event) => setProyectoId(event.target.value)} className="h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todo el portafolio</option>{proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}</select></div>
              </div>
              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex max-w-lg items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0" />Solo salen a la IA tu misión y métricas anónimas. Datos identificables y contractuales permanecen privados.</p>
                <Button size="lg" disabled={cargando} onClick={() => ejecutarLoop(false)}>{cargando ? "Analizando…" : "Iniciar vuelta"}<Send /></Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">Misión:</span><span className="text-muted-foreground">{objetivo}</span><span className="rounded-full bg-muted px-2 py-1 text-xs">{FOCO_LABEL[foco]}</span></div>
            <LancelotBrief salida={salida} numero={numero} />
            <Card>
              <CardHeader><CardTitle>Cierra la vuelta con realidad</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="lancelot-feedback">¿Qué ejecutaste, qué resultado obtuviste y qué cambió?</Label><Textarea id="lancelot-feedback" value={retroalimentacion} onChange={(event) => setRetroalimentacion(event.target.value)} maxLength={1200} rows={4} placeholder={salida.siguiente_pregunta} /></div>
                <div className="flex justify-end"><Button size="lg" disabled={cargando} onClick={() => ejecutarLoop(true)}>{cargando ? "Aprendiendo…" : "Cerrar y continuar"}<Send /></Button></div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-4 text-primary" />Misiones recientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sesiones.length === 0 ? <p className="text-sm text-muted-foreground">Tu primera misión aparecerá aquí.</p> : sesiones.map((sesion) => <Link key={sesion.id} href={`/lancelot?sesion=${sesion.id}`} className="block rounded-lg border p-3 hover:border-primary"><p className="line-clamp-2 text-sm font-medium">{sesion.objetivo}</p><p className="mt-1 text-xs text-muted-foreground">{FOCO_LABEL[sesion.foco]}</p></Link>)}
          </CardContent>
        </Card>
        <p className="px-1 text-xs leading-5 text-muted-foreground">Economía activa: modelo Haiku, memoria resumida a dos vueltas y salida limitada a 1.200 tokens.</p>
      </aside>
    </div>
  );
}

