"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { validarHallazgoIA } from "@/lib/actions/entrevistas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/types";

type Entrevista = Database["public"]["Tables"]["entrevistas"]["Row"];

const CONFIANZA_CLASS = {
  alta: "bg-success/20 text-success",
  media: "bg-secondary/30 text-foreground",
  baja: "bg-muted text-muted-foreground",
};

export function HallazgosIAReview({ entrevista }: { entrevista: Entrevista }) {
  const router = useRouter();
  const [transcripcion, setTranscripcion] = useState(entrevista.transcripcion ?? "");
  const [isAnalizando, startAnalisis] = useTransition();
  const [isValidando, startValidacion] = useTransition();
  const [esfuerzos, setEsfuerzos] = useState<Record<number, number>>({});

  const yaValidados = new Set((entrevista.hallazgos_validados ?? []).map((h) => h.indice));

  function analizar(confirmarSobrescritura = false) {
    if (transcripcion.trim().length < 20) {
      toast.error("Pega una transcripción con al menos un par de frases.");
      return;
    }
    startAnalisis(async () => {
      const res = await fetch("/api/ia/analizar-entrevista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entrevistaId: entrevista.id, transcripcion, confirmarSobrescritura }),
      });
      const data = await res.json();

      if (res.status === 409 && data.requiereConfirmacion) {
        const acepta = window.confirm(
          `${data.error}\n\n¿Quieres continuar de todas formas? Los hallazgos ya validados de esta entrevista podrían quedar desalineados.`
        );
        if (acepta) analizar(true);
        return;
      }

      if (!res.ok) {
        toast.error(data.error ?? "No se pudo analizar la entrevista.");
        return;
      }
      toast.success(`IA propuso ${data.analisis.hallazgos.length} hallazgo(s). Revísalos antes de validar.`);
      router.refresh();
    });
  }

  function aprobar(indice: number) {
    const esfuerzo = esfuerzos[indice] ?? 3;
    startValidacion(async () => {
      const result = await validarHallazgoIA({
        entrevistaId: entrevista.id,
        proyectoId: entrevista.proyecto_id,
        indice,
        esfuerzo: esfuerzo as 1 | 2 | 3 | 4 | 5,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Hallazgo agregado a la matriz de priorización.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="transcripcion">
          Transcripción
        </label>
        <Textarea
          id="transcripcion"
          rows={8}
          value={transcripcion}
          onChange={(e) => setTranscripcion(e.target.value)}
          placeholder="Pega aquí la transcripción de la entrevista..."
        />
        <Button onClick={() => analizar()} disabled={isAnalizando} className="self-start">
          {isAnalizando ? "Analizando con IA..." : "Analizar con IA"}
        </Button>
      </div>

      {entrevista.nivel_resistencia && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Nivel de resistencia percibido:</span>
          <Badge className="bg-secondary/30 text-foreground">{entrevista.nivel_resistencia}</Badge>
        </div>
      )}

      {entrevista.senales_gobierno && entrevista.senales_gobierno.length > 0 && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm">
          <p className="font-semibold text-destructive">Señales de gobierno detectadas</p>
          <ul className="mt-2 list-disc pl-5 text-foreground">
            {entrevista.senales_gobierno.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {entrevista.hallazgos_ia && entrevista.hallazgos_ia.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Hallazgos propuestos por IA</h2>
          <p className="text-sm text-muted-foreground">
            La IA propone, tú decides. Ningún hallazgo pasa a la matriz de priorización sin que lo apruebes.
          </p>
          {entrevista.hallazgos_ia.map((h, indice) => {
            const validado = yaValidados.has(indice);
            return (
              <Card key={indice} className={validado ? "opacity-60" : undefined}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{h.titulo}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={CONFIANZA_CLASS[h.confianza]}>confianza {h.confianza}</Badge>
                    <Badge className="bg-muted">{h.categoria}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm">{h.descripcion}</p>
                  <p className="text-xs italic text-muted-foreground">&quot;{h.cita_soporte}&quot;</p>
                  {validado ? (
                    <p className="text-xs font-medium text-success">✓ Validado y agregado a hallazgos</p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Impacto estimado: {h.impacto_estimado}/5</span>
                      <Select
                        value={(esfuerzos[indice] ?? 3).toString()}
                        onValueChange={(v) => setEsfuerzos((prev) => ({ ...prev, [indice]: Number(v) }))}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              Esfuerzo {n}/5
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" disabled={isValidando} onClick={() => aprobar(indice)}>
                        Validar y agregar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
