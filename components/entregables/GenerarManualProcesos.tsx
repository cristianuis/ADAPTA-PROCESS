"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function GenerarManualProcesos({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [isDescargando, startDescarga] = useTransition();

  function descargar() {
    startDescarga(async () => {
      const res = await fetch("/api/documentos/manual-procesos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyectoId }),
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
      a.download = "Manual de Procesos.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Manual descargado.");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Manual de Procesos</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Compila todos los procesos diseñados (SIPOC, actividades, indicadores) en un solo documento navegable.
        </p>
        <Button onClick={descargar} disabled={isDescargando}>
          {isDescargando ? "Generando documento..." : "Descargar manual (.docx)"}
        </Button>
      </CardContent>
    </Card>
  );
}
