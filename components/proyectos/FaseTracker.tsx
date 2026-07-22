import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FASE_LABEL, FASES_ORDEN } from "@/components/proyectos/FaseBadge";
import { TYPE_SCALE } from "@/lib/design/tokens";
import type { EstadoProyecto } from "@/lib/supabase/types";

// Las 6 fases núcleo del modelo ADAPTA (excluye los marcadores prospecto/cerrado).
const FASES_NUCLEO = FASES_ORDEN.slice(1, -1);

export interface ConteoEntregables {
  total: number;
  completados: number;
}

interface FaseTrackerProps {
  estadoActual: EstadoProyecto;
  conteoPorFase?: Partial<Record<EstadoProyecto, ConteoEntregables>>;
}

export function FaseTracker({ estadoActual, conteoPorFase }: FaseTrackerProps) {
  const indexActual = FASES_ORDEN.indexOf(estadoActual);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            TYPE_SCALE.meta,
            "shrink-0",
            estadoActual === "prospecto" && "font-medium text-primary"
          )}
        >
          Prospecto
        </span>
        <div className="flex flex-1 items-center">
          {FASES_NUCLEO.map((fase, i) => {
            const idx = FASES_ORDEN.indexOf(fase);
            const estado = idx < indexActual ? "completada" : idx === indexActual ? "actual" : "pendiente";
            const conteo = conteoPorFase?.[fase];

            return (
              <div key={fase} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                      estado === "completada" && "border-success bg-success text-success-foreground",
                      estado === "actual" && "border-primary bg-primary text-primary-foreground",
                      estado === "pendiente" && "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {estado === "completada" ? <CheckIcon className="size-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      TYPE_SCALE.meta,
                      "whitespace-nowrap text-center",
                      estado === "actual" && "font-semibold text-foreground",
                      estado === "completada" && "text-foreground"
                    )}
                  >
                    {FASE_LABEL[fase]}
                  </span>
                  {conteo && conteo.total > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {conteo.completados}/{conteo.total}
                    </span>
                  )}
                </div>
                {i < FASES_NUCLEO.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1",
                      idx < indexActual ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <span
          className={cn(
            TYPE_SCALE.meta,
            "shrink-0",
            estadoActual === "cerrado" && "font-medium text-primary"
          )}
        >
          Cerrado
        </span>
      </div>
    </div>
  );
}
