"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DescargarInformeAdopcion({ auditoriaId }: { auditoriaId: string }) {
  const [isDescargando, startDescarga] = useTransition();

  function descargar() {
    startDescarga(async () => {
      const res = await fetch("/api/documentos/informe-adopcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditoriaId }),
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
      a.download = "Informe de Adopcion.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Informe descargado.");
    });
  }

  return (
    <Button variant="outline" onClick={descargar} disabled={isDescargando} className="self-start">
      {isDescargando ? "Generando..." : "Descargar informe de adopción (.docx)"}
    </Button>
  );
}
