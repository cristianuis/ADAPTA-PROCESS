import { ArrowUpRight, BriefcaseBusiness, Check, CircleDashed, Target } from "lucide-react";
import Link from "next/link";
import { PASOS_RECORRIDO } from "@/lib/proyectos/recorrido-guiado";
import { derivarFaseMetodologica } from "@/lib/proyectos/fase-metodologica";
import { FASES_ORDEN, FASE_LABEL } from "@/components/proyectos/FaseBadge";
import { SPACING_SCALE, TYPE_SCALE } from "@/lib/design/tokens";
import type { ProyectoGuia } from "@/lib/lancelot/siguiente-accion";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  proyectos: ProyectoGuia[];
  proyectoId: string | null;
  empresasSinProyecto: number;
}

export function LancelotExecutiveDashboard({ proyectos, proyectoId, empresasSinProyecto }: Props) {
  const proyecto = proyectos.find((item) => item.id === proyectoId) ?? null;
  const pasosCompletos = proyecto?.completitud.filter(Boolean).length ?? 0;
  const totalPasos = PASOS_RECORRIDO.length;
  const porcentaje = proyecto ? Math.round((pasosCompletos / totalPasos) * 100) : 0;
  const circunferencia = 2 * Math.PI * 48;
  const clientesActivos = new Set(proyectos.map((item) => item.clienteId)).size + empresasSinProyecto;
  const faseActual = proyecto ? derivarFaseMetodologica(proyecto.completitud) : null;
  const indiceFase = faseActual ? FASES_ORDEN.indexOf(faseActual) : -1;

  return (
    <section aria-labelledby="panel-consultoria" className={`flex flex-col ${SPACING_SCALE.lg}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Panel de intervención</p>
          <h2 id="panel-consultoria" className={`${TYPE_SCALE.h2} mt-1 text-xl sm:text-2xl`}>
            {proyecto ? proyecto.cliente : "Tu operación de consultoría"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {proyecto ? proyecto.nombre : "Una vista viva del trabajo registrado en Lancelot."}
          </p>
        </div>
        {proyecto && (
          <Link
            href={`/proyectos/${proyecto.id}`}
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Abrir intervención <ArrowUpRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
        <Card className="overflow-hidden border-primary bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/10">
          <CardContent className="grid gap-5 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-6">
            <div
              className="relative mx-auto size-32 sm:mx-0"
              role="progressbar"
              aria-label={proyecto ? `Avance de ${proyecto.cliente}` : "Avance de intervención"}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={porcentaje}
              aria-valuetext={proyecto ? `${pasosCompletos} de ${totalPasos} hitos completados` : "Selecciona una intervención"}
            >
              <svg viewBox="0 0 112 112" className="size-full -rotate-90" role="img" aria-hidden="true">
                <circle cx="56" cy="56" r="48" fill="none" stroke="var(--primary-foreground)" strokeOpacity="0.18" strokeWidth="9" />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke="var(--secondary)"
                  strokeLinecap="round"
                  strokeWidth="9"
                  strokeDasharray={circunferencia}
                  strokeDashoffset={circunferencia * (1 - porcentaje / 100)}
                  className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums">{proyecto ? `${porcentaje}%` : "—"}</span>
                <span className="text-[11px] text-primary-foreground/70">avance real</span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Target className="size-4 text-secondary" />
                {proyecto ? "Recorrido metodológico" : "Selecciona una intervención"}
              </div>
              {proyecto ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
                    {pasosCompletos} de {totalPasos} hitos registrados. El siguiente paso se calcula con la información guardada, no con una estimación.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-foreground/15" aria-hidden="true">
                      <div
                        className="h-full rounded-full bg-secondary transition-[width] duration-700 motion-reduce:transition-none"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-primary-foreground/75">{pasosCompletos}/{totalPasos}</span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
                  Elige una empresa arriba para ver su avance, los hitos realizados y el siguiente movimiento recomendado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/80">
            <CardContent className="p-4">
              <BriefcaseBusiness className="size-4 text-primary" />
              <p className="mt-3 text-2xl font-semibold tabular-nums">{clientesActivos}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">empresas en cartera</p>
            </CardContent>
          </Card>
          <Card className="border-border/80">
            <CardContent className="p-4">
              <CircleDashed className="size-4 text-primary" />
              <p className="mt-3 text-2xl font-semibold tabular-nums">{proyectos.length}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">intervenciones abiertas</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 border-primary/15 bg-primary/[0.035]">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Prioridad visible</p>
                <p className="mt-1 text-sm font-semibold">
                  {proyecto ? (pasosCompletos === totalPasos ? "Revisar y cerrar" : PASOS_RECORRIDO[pasosCompletos]?.nombre ?? "Revisar intervención") : "Registrar la primera empresa"}
                </p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden="true">
                {proyecto && pasosCompletos > 0 ? <Check className="size-4" /> : <ArrowUpRight className="size-4" />}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {proyecto && (
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-secondary/[0.08]">
          <CardContent className="border-b border-border/70 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Fase metodológica</h3>
                <p className="mt-1 text-xs text-muted-foreground">Derivada automáticamente del primer hito pendiente.</p>
              </div>
              {faseActual && <span className="text-sm font-semibold text-primary">{FASE_LABEL[faseActual]}</span>}
            </div>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Progreso por fases metodológicas">
              {FASES_ORDEN.map((fase, index) => {
                const faseCompleta = index < indiceFase;
                const faseActiva = index === indiceFase;
                return (
                  <li key={fase} aria-current={faseActiva ? "step" : undefined} className="min-w-0">
                    <div className={`h-1.5 overflow-hidden rounded-full ${faseCompleta ? "bg-success" : faseActiva ? "bg-primary" : "bg-muted"}`}>
                      {faseActiva && (
                        <div className="h-full w-2/3 rounded-full bg-secondary transition-[width] duration-700 motion-reduce:transition-none" />
                      )}
                    </div>
                    <p className={`mt-2 truncate text-xs ${faseActiva ? "font-semibold text-primary" : faseCompleta ? "font-medium text-success" : "text-muted-foreground"}`}>
                      {FASE_LABEL[fase]}
                    </p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Los 12 hitos del método</h3>
                <p className="mt-1 text-xs text-muted-foreground">La ruta cambia a medida que completas el trabajo.</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">{pasosCompletos} completados</span>
            </div>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {PASOS_RECORRIDO.map((paso, index) => {
                const completo = !!proyecto.completitud[index];
                const actual = !completo && proyecto.completitud.slice(0, index).every(Boolean);
                return (
                  <li
                    key={paso.numero}
                    aria-current={actual ? "step" : undefined}
                    className={`flex min-h-14 items-start gap-2 rounded-lg border p-2.5 transition-colors motion-reduce:transition-none ${
                      completo
                        ? "border-success/25 bg-success/[0.06]"
                        : actual
                          ? "border-primary/40 bg-primary/[0.06] shadow-sm"
                          : "border-border/70 bg-background/70"
                    }`}
                  >
                    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${completo ? "bg-success text-success-foreground" : actual ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {completo ? <Check className="size-3" /> : paso.numero}
                    </span>
                    <span className={`text-xs leading-4 ${actual ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{paso.nombre}</span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
