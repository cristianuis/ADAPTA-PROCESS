"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cotizarPorArquetipo } from "@/lib/tarifa/calcular-tarifa";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Arquetipo } from "@/lib/supabase/types";

const ALCANCE_DEFAULT = `El proyecto cubre el diagnóstico organizacional completo (triage, madurez PEMM, levantamiento por entrevistas) y el diseño de la ruta de intervención recomendada para la fase inicial.

Incluye: informe de diagnóstico, matriz de hallazgos priorizados y plan de fases con cronograma preliminar.`;

const EXCLUSIONES_DEFAULT = `No incluye: implementación de sistemas de información, desarrollo de software a la medida, ni acompañamiento posterior a la entrega del diagnóstico salvo que se acuerde como fase adicional.

Cualquier alcance no descrito explícitamente arriba se considera fuera de esta propuesta.`;

interface Props {
  proyectoId: string;
  arquetipo: Arquetipo | null;
  numEmpleados: number | null;
  tarifaHoraDefault: number;
}

function tamanoDeCliente(numEmpleados: number | null): "pequena" | "mediana" | "grande" {
  if (!numEmpleados) return "mediana";
  if (numEmpleados < 50) return "pequena";
  if (numEmpleados <= 250) return "mediana";
  return "grande";
}

export function GenerarPropuestaComercial({ proyectoId, arquetipo, numEmpleados, tarifaHoraDefault }: Props) {
  const router = useRouter();
  const [alcance, setAlcance] = useState(ALCANCE_DEFAULT);
  const [exclusiones, setExclusiones] = useState(EXCLUSIONES_DEFAULT);
  const [justificacion, setJustificacion] = useState("");
  const [tarifaHora, setTarifaHora] = useState(tarifaHoraDefault || 100000);
  const [isGenerandoTexto, startTexto] = useTransition();
  const [isDescargando, startDescarga] = useTransition();

  const cotizacion = arquetipo
    ? cotizarPorArquetipo({ arquetipo, tamano: tamanoDeCliente(numEmpleados), tarifaHora })
    : null;

  function generarJustificacion() {
    startTexto(async () => {
      const res = await fetch("/api/ia/justificacion-metodologica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyectoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo generar el texto.");
        return;
      }
      setJustificacion(data.texto);
      toast.success("Borrador generado. Revísalo antes de exportar.");
    });
  }

  function descargar() {
    if (!justificacion.trim()) {
      toast.error("Genera o escribe la justificación metodológica primero.");
      return;
    }
    startDescarga(async () => {
      const res = await fetch("/api/documentos/propuesta-comercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyectoId,
          alcance,
          exclusiones,
          justificacionMetodologica: justificacion,
          inversionMinima: cotizacion?.rangoMinimo ?? 0,
          inversionMaxima: cotizacion?.rangoMaximo ?? 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "No se pudo generar el documento.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Propuesta Comercial.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Propuesta descargada.");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Propuesta comercial</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!arquetipo && (
          <p className="text-sm text-muted-foreground">
            Este proyecto no tiene triage aplicado — la cotización usará un rango genérico.
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tarifaHora">Tarifa hora ($)</Label>
            <Input
              id="tarifaHora"
              type="number"
              min={0}
              value={tarifaHora}
              onChange={(e) => setTarifaHora(Number(e.target.value))}
              className="w-40"
            />
          </div>
          {cotizacion && (
            <p className="text-sm text-muted-foreground">
              Cotización estimada ({cotizacion.horasEstimadas}h):{" "}
              <span className="font-medium text-foreground">
                {cotizacion.rangoMinimo.toLocaleString("es-CO")} — {cotizacion.rangoMaximo.toLocaleString("es-CO")}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="alcance">Alcance</Label>
          <Textarea id="alcance" rows={4} value={alcance} onChange={(e) => setAlcance(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="exclusiones">Exclusiones</Label>
          <Textarea id="exclusiones" rows={3} value={exclusiones} onChange={(e) => setExclusiones(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="justificacion">Justificación metodológica</Label>
            <Button variant="outline" size="sm" onClick={generarJustificacion} disabled={isGenerandoTexto || !arquetipo}>
              {isGenerandoTexto ? "Generando..." : "Generar borrador con IA"}
            </Button>
          </div>
          <Textarea
            id="justificacion"
            rows={5}
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder="Por qué esta ruta de intervención es la adecuada para este cliente..."
          />
        </div>

        <Button onClick={descargar} disabled={isDescargando} className="self-start">
          {isDescargando ? "Generando documento..." : "Descargar propuesta (.docx)"}
        </Button>
      </CardContent>
    </Card>
  );
}
