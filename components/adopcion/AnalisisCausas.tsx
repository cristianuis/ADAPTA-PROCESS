"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { actualizarCausasIdentificadas } from "@/lib/actions/auditorias";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  auditoriaId: string;
  proyectoId: string;
  porcentajeAdopcion: number;
  casosRevisados: number;
  casosConformes: number;
  desviaciones: string[];
  causasGuardadas: string | null;
}

export function AnalisisCausas({
  auditoriaId,
  proyectoId,
  porcentajeAdopcion,
  casosRevisados,
  casosConformes,
  desviaciones,
  causasGuardadas,
}: Props) {
  const [causas, setCausas] = useState(causasGuardadas ?? "");
  const [isAnalizando, startAnalisis] = useTransition();
  const [isGuardando, startGuardado] = useTransition();

  function analizar() {
    startAnalisis(async () => {
      const res = await fetch("/api/ia/analisis-desviaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyectoId, porcentajeAdopcion, casosRevisados, casosConformes, desviaciones }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo generar el análisis.");
        return;
      }
      setCausas(data.texto);
      toast.success("Hipótesis generada. Revísala antes de guardar.");
    });
  }

  function guardar() {
    startGuardado(async () => {
      const result = await actualizarCausasIdentificadas({ auditoriaId, proyectoId, causas });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Guardado.");
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Análisis de causas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Hipótesis de causa raíz — siempre editable.</p>
          <Button variant="outline" size="sm" onClick={analizar} disabled={isAnalizando}>
            {isAnalizando ? "Analizando..." : "Generar hipótesis con IA"}
          </Button>
        </div>
        <Textarea rows={6} value={causas} onChange={(e) => setCausas(e.target.value)} />
        <Button onClick={guardar} disabled={isGuardando} className="self-start">
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
}
