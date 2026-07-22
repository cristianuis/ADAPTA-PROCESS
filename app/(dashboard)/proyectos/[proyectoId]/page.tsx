import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, ListChecks, GitBranch, LayoutDashboard, TrendingUp, FileText, ClipboardList } from "lucide-react";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTriage } from "@/lib/actions/triage";
import { listarEntregables } from "@/lib/actions/entregables";
import { listarEvaluacionesPemm } from "@/lib/actions/pemm";
import { FaseTracker, type ConteoEntregables } from "@/components/proyectos/FaseTracker";
import { FASES_ORDEN } from "@/components/proyectos/FaseBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TYPE_SCALE, SPACING_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { EstadoProyecto } from "@/lib/supabase/types";

const FASES_NUCLEO = FASES_ORDEN.slice(1, -1) as EstadoProyecto[];

const FASE_ENTREGABLE_LABEL: Record<EstadoProyecto, string> = {
  prospecto: "Prospecto",
  diagnostico: "Avalúo",
  definicion: "Definición",
  arquitectura: "Arquitectura",
  pilotaje: "Pilotaje",
  transferencia: "Transferencia",
  anclaje: "Anclaje",
  cerrado: "Cerrado",
};

const ESTADO_ENTREGABLE_LABEL: Record<string, string> = {
  borrador: "Borrador",
  revision: "En revisión",
  entregado: "Entregado",
  aceptado: "Aceptado",
};

const ESTADO_ENTREGABLE_CLASS: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  revision: "bg-secondary/30 text-foreground",
  entregado: "bg-primary/15 text-primary",
  aceptado: "bg-success/20 text-success",
};

const NAV_ITEMS = [
  { href: "pemm", label: "Diagnóstico PEMM", icon: ClipboardList },
  { href: "entrevistas", label: "Entrevistas", icon: MessageSquare },
  { href: "hallazgos", label: "Hallazgos", icon: ListChecks },
  { href: "procesos", label: "Procesos", icon: GitBranch },
  { href: "tablero", label: "Tablero", icon: LayoutDashboard },
  { href: "adopcion", label: "Adopción", icon: TrendingUp },
  { href: "entregables", label: "Entregables", icon: FileText },
];

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const [triage, entregables, evaluacionesPemm] = await Promise.all([
    obtenerTriage(proyectoId),
    listarEntregables(proyectoId),
    listarEvaluacionesPemm(proyectoId),
  ]);

  const conteoPorFase: Partial<Record<EstadoProyecto, ConteoEntregables>> = {};
  for (const fase of FASES_NUCLEO) {
    const delFase = entregables.filter((e) => e.fase === fase);
    if (delFase.length > 0) {
      conteoPorFase[fase] = {
        total: delFase.length,
        completados: delFase.filter((e) => e.estado === "entregado" || e.estado === "aceptado").length,
      };
    }
  }

  const sinFase = entregables.filter((e) => !e.fase || !FASES_NUCLEO.includes(e.fase as EstadoProyecto));
  const nivelesPemm = evaluacionesPemm.filter((ev) => ev.estado === "respondida");

  return (
    <div className={cn("flex flex-col", SPACING_SCALE.xl)}>
      <div>
        <h1 className={TYPE_SCALE.h1}>{proyecto.nombre}</h1>
        <p className={TYPE_SCALE.meta}>
          Cliente:{" "}
          <Link href={`/clientes/${proyecto.clientes?.id}`} className="hover:underline">
            {proyecto.clientes?.razon_social}
          </Link>
        </p>
      </div>

      <Card>
        <CardContent className="py-5">
          <FaseTracker estadoActual={proyecto.estado} conteoPorFase={conteoPorFase} />
        </CardContent>
      </Card>

      <div className={cn("grid grid-cols-1 lg:grid-cols-3", SPACING_SCALE["2xl"])}>
        <div className={cn("flex flex-col lg:col-span-2", SPACING_SCALE.lg)}>
          <h2 className={TYPE_SCALE.h2}>Entregables por fase</h2>
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {FASES_NUCLEO.map((fase) => {
                const delFase = entregables.filter((e) => e.fase === fase);
                return (
                  <div key={fase} className={cn("flex flex-col p-4", SPACING_SCALE.sm)}>
                    <span className={cn(TYPE_SCALE.body, "font-medium")}>{FASE_ENTREGABLE_LABEL[fase]}</span>
                    {delFase.length === 0 ? (
                      <p className={TYPE_SCALE.meta}>Sin entregables en esta fase.</p>
                    ) : (
                      delFase.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-2">
                          <span className={TYPE_SCALE.body}>{e.nombre}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            {e.fecha_entrega && <span className={TYPE_SCALE.meta}>{e.fecha_entrega}</span>}
                            <Badge className={ESTADO_ENTREGABLE_CLASS[e.estado]}>
                              {ESTADO_ENTREGABLE_LABEL[e.estado]}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
              {sinFase.length > 0 && (
                <div className={cn("flex flex-col p-4", SPACING_SCALE.sm)}>
                  <span className={cn(TYPE_SCALE.body, "font-medium")}>Sin fase asignada</span>
                  {sinFase.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2">
                      <span className={TYPE_SCALE.body}>{e.nombre}</span>
                      <Badge className={ESTADO_ENTREGABLE_CLASS[e.estado]}>{ESTADO_ENTREGABLE_LABEL[e.estado]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className={cn("flex flex-col", SPACING_SCALE.lg)}>
          <h2 className={TYPE_SCALE.h2}>Resumen de diagnóstico</h2>
          <Card>
            <CardContent className={cn("flex flex-col pt-5", SPACING_SCALE.md)}>
              {triage ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className={TYPE_SCALE.meta}>Arquetipo</span>
                    <Badge className="bg-primary/15 text-primary">
                      {triage.arquetipo_sugerido} · {triage.puntaje_total}
                    </Badge>
                  </div>
                  {triage.alerta_gobierno && (
                    <Badge className="w-fit bg-destructive/15 text-destructive">Alerta de gobierno activa</Badge>
                  )}
                  {nivelesPemm.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between">
                      <span className={cn(TYPE_SCALE.meta, "truncate")}>
                        {ev.tipo === "proceso" ? ev.proceso_evaluado ?? "Proceso" : "Empresa"}
                      </span>
                      <Badge className="bg-secondary/30 text-foreground">Nivel {ev.nivel_resultante}</Badge>
                    </div>
                  ))}
                  <Link
                    href={`/proyectos/${proyecto.id}/triage/resultado`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver diagnóstico completo →
                  </Link>
                </>
              ) : (
                <>
                  <p className={TYPE_SCALE.meta}>Este proyecto todavía no tiene triage aplicado.</p>
                  <Link href={`/proyectos/${proyecto.id}/triage`} className="text-sm text-primary hover:underline">
                    Iniciar triage →
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`/proyectos/${proyecto.id}/${item.href}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
                  TYPE_SCALE.body
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
