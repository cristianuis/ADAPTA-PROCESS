import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FASE_LABEL, FASES_ORDEN } from "@/components/proyectos/FaseBadge";
import { TYPE_SCALE } from "@/lib/design/tokens";
import type { FaseMetodologica } from "@/lib/supabase/types";

export interface ConteoEntregables {
  total: number;
  completados: number;
}

interface FaseTrackerProps {
  faseActual: FaseMetodologica;
  conteoPorFase?: Partial<Record<FaseMetodologica, ConteoEntregables>>;
}

export function FaseTracker({ faseActual, conteoPorFase }: FaseTrackerProps) {
  const indexActual = FASES_ORDEN.indexOf(faseActual);

  return (
    <div className="flex items-center overflow-x-auto pb-2">
      {FASES_ORDEN.map((fase, indice) => {
        const estado =
          indice < indexActual ? "completada" : indice === indexActual ? "actual" : "pendiente";
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
                {estado === "completada" ? <CheckIcon className="size-4" /> : indice + 1}
              </div>
              <span
                className={cn(
                  TYPE_SCALE.meta,
                  "whitespace-nowrap text-center",
                  estado !== "pendiente" && "font-semibold text-foreground"
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
            {indice < FASES_ORDEN.length - 1 && (
              <div className={cn("mx-2 h-0.5 min-w-6 flex-1", indice < indexActual ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
