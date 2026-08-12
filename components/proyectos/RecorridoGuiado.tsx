"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle } from "lucide-react";
import { calcularEstadosPasos, PASOS_RECORRIDO, type PasoConEstado } from "@/lib/proyectos/recorrido-guiado";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TYPE_SCALE, SPACING_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export interface DatosRecorrido {
  clienteId: string;
  clienteCompleto: boolean;
  triageCompleto: boolean;
  pemmEmpresaCompleto: boolean;
  pemmProcesoCompleto: boolean;
  entrevistasCompleto: boolean;
  hallazgosValidadosCompleto: boolean;
  planMejoraCompleto: boolean;
  informeDiagnosticoCompleto: boolean;
  procesosConDuenoCompleto: boolean;
  sipocActividadIndicadorCompleto: boolean;
  manualProcesosCompleto: boolean;
  auditoriaAdopcionCompleto: boolean;
}

function PasoRow({
  paso,
  onSeleccionar,
}: {
  paso: PasoConEstado;
  onSeleccionar: (paso: PasoConEstado) => void;
}) {
  function handleClick() {
    onSeleccionar(paso);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center px-4 py-3 text-left transition-colors hover:bg-muted/50",
        SPACING_SCALE.md,
        paso.estado === "actual" && "border-l-4 border-l-primary bg-primary/5",
        paso.estado !== "actual" && paso.estado !== "completado" && "opacity-60"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          paso.estado === "completado" && "bg-success/20 text-success",
          paso.estado === "actual" && "bg-primary text-primary-foreground",
          (paso.estado === "pendiente" || paso.estado === "fuera_de_secuencia") && "bg-muted text-muted-foreground"
        )}
      >
        {paso.estado === "completado" ? <Check className="size-4" /> : paso.numero}
      </span>
      <span className={cn(TYPE_SCALE.body, paso.estado === "actual" && "font-semibold", "flex-1")}>
        {paso.nombre}
      </span>
      {paso.estado === "fuera_de_secuencia" && (
        <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      )}
      {paso.estado === "actual" && <Badge className="shrink-0 bg-primary/15 text-primary">Siguiente paso</Badge>}
    </button>
  );
}

export function RecorridoGuiado({ proyectoId, datos }: { proyectoId: string; datos: DatosRecorrido }) {
  const router = useRouter();
  const [pasoConfirmar, setPasoConfirmar] = useState<PasoConEstado | null>(null);

  const completitud = useMemo<boolean[]>(
    () => [
      datos.clienteCompleto,
      datos.triageCompleto,
      datos.pemmEmpresaCompleto,
      datos.pemmProcesoCompleto,
      datos.entrevistasCompleto,
      datos.hallazgosValidadosCompleto,
      datos.planMejoraCompleto,
      datos.informeDiagnosticoCompleto,
      datos.procesosConDuenoCompleto,
      datos.sipocActividadIndicadorCompleto,
      datos.manualProcesosCompleto,
      datos.auditoriaAdopcionCompleto,
    ],
    [datos]
  );

  const pasos = useMemo(() => calcularEstadosPasos(completitud), [completitud]);

  function hrefDePaso(numero: number): string {
    switch (numero) {
      case 1:
        return `/clientes/${datos.clienteId}`;
      case 2:
        return datos.triageCompleto
          ? `/proyectos/${proyectoId}/triage/resultado`
          : `/proyectos/${proyectoId}/triage`;
      case 3:
      case 4:
        return `/proyectos/${proyectoId}/pemm`;
      case 5:
      case 6:
        return `/proyectos/${proyectoId}/entrevistas`;
      case 7:
        return `/proyectos/${proyectoId}/mejoras`;
      case 8:
      case 11:
        return `/proyectos/${proyectoId}/entregables`;
      case 9:
      case 10:
        return `/proyectos/${proyectoId}/procesos`;
      case 12:
        return `/proyectos/${proyectoId}/adopcion`;
      default:
        return `/proyectos/${proyectoId}`;
    }
  }

  function handleClickPaso(paso: PasoConEstado) {
    if (paso.estado === "fuera_de_secuencia") {
      setPasoConfirmar(paso);
      return;
    }
    router.push(hrefDePaso(paso.numero));
  }

  function confirmarContinuar() {
    if (!pasoConfirmar) return;
    const numero = pasoConfirmar.numero;
    setPasoConfirmar(null);
    router.push(hrefDePaso(numero));
  }

  const nombrePrerequisito =
    pasoConfirmar?.prereq != null ? PASOS_RECORRIDO[pasoConfirmar.prereq - 1]?.nombre ?? null : null;

  return (
    <div className={cn("flex flex-col", SPACING_SCALE.lg)}>
      <h2 className={TYPE_SCALE.h2}>Recorrido guiado</h2>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">
          {pasos.map((paso) => (
            <PasoRow key={paso.numero} paso={paso} onSeleccionar={handleClickPaso} />
          ))}
        </CardContent>
      </Card>

      <Dialog open={pasoConfirmar !== null} onOpenChange={(open) => !open && setPasoConfirmar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Continuar fuera de secuencia?</DialogTitle>
            <DialogDescription>
              {nombrePrerequisito
                ? `Normalmente "${nombrePrerequisito}" se completa antes de esto.`
                : "Normalmente el paso anterior se completa antes de esto."}{" "}
              ¿Continuar igual?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasoConfirmar(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarContinuar}>Continuar de todas formas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
