"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CoberturaInforme360 } from "@/lib/documentos/evaluar-informe-360";
import { REQUISITOS_INFORME_360 } from "@/lib/documentos/evaluar-informe-360";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function GenerarInforme360({ proyectoId, cobertura }: { proyectoId: string; cobertura: CoberturaInforme360 }) {
  const [sintesis, setSintesis] = useState("");
  const [pendiente, startTransition] = useTransition();
  const router = useRouter();
  const listo = REQUISITOS_INFORME_360.every(({ clave }) => cobertura[clave] > 0);

  function descargar() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/documentos/informe-360", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proyectoId, sintesisConsultor: sintesis }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error ?? "No se pudo generar el informe.");
          return;
        }
        const url = URL.createObjectURL(await res.blob());
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = "Informe-360-NEXUS.docx";
        enlace.click();
        URL.revokeObjectURL(url);
        toast.success("Informe 360 descargado y registrado.");
        router.refresh();
      } catch {
        toast.error("No se pudo conectar con el generador de informes.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informe 360° de intervención</CardTitle>
        <p className="text-sm text-muted-foreground">Reúne evidencia, PEMM, AS-IS, TO-BE, indicadores y roadmap. No convierte proyecciones en resultados ni sustituye la aprobación del cliente.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {REQUISITOS_INFORME_360.map((requisito) => (
            <p key={requisito.clave} className="text-sm"><span aria-hidden="true">{cobertura[requisito.clave] > 0 ? "✓" : "○"}</span> {requisito.descripcion}</p>
          ))}
        </div>
        <div className="space-y-2">
          <label htmlFor="informe-360-sintesis" className="text-sm font-medium">Síntesis ejecutiva revisada por ti</label>
          <Textarea id="informe-360-sintesis" rows={5} value={sintesis} onChange={(e) => setSintesis(e.target.value)} placeholder="Qué se observó, qué se propone y qué aún requiere validación del cliente." />
        </div>
        <Button disabled={!listo || pendiente || sintesis.trim().length < 30} onClick={descargar}>
          {pendiente ? "Preparando informe..." : "Descargar Informe 360° (.docx)"}
        </Button>
        {!listo && <p className="text-xs text-muted-foreground">Completa las piezas faltantes antes de emitir un informe integral.</p>}
      </CardContent>
    </Card>
  );
}
