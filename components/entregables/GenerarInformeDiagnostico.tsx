"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GenerarInformeDiagnostico({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [resumen, setResumen] = useState("");
  const [isGenerandoResumen, startResumen] = useTransition();
  const [isDescargando, startDescarga] = useTransition();

  function generarResumen() {
    startResumen(async () => {
      const res = await fetch("/api/ia/resumen-ejecutivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyectoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo generar el resumen.");
        return;
      }
      setResumen(data.resumen);
      toast.success("Borrador generado. Revísalo y edítalo antes de exportar.");
    });
  }

  function descargar() {
    if (!resumen.trim()) {
      toast.error("Escribe o genera un resumen ejecutivo primero.");
      return;
    }
    startDescarga(async () => {
      const res = await fetch("/api/documentos/informe-diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyectoId, resumenEjecutivo: resumen }),
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
      a.download = "Informe de Diagnostico.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Informe descargado.");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Informe de Diagnóstico</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Resumen ejecutivo</label>
            <Button variant="outline" size="sm" onClick={generarResumen} disabled={isGenerandoResumen}>
              {isGenerandoResumen ? "Generando..." : "Generar borrador con IA"}
            </Button>
          </div>
          <Textarea
            rows={8}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            placeholder="Escribe el resumen ejecutivo o genera un borrador con IA — siempre editable antes de exportar."
          />
        </div>
        <Button onClick={descargar} disabled={isDescargando} className="self-start">
          {isDescargando ? "Generando documento..." : "Descargar informe (.docx)"}
        </Button>
      </CardContent>
    </Card>
  );
}
