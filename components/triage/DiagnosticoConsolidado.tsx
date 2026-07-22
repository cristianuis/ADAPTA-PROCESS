import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import { DIMENSION_LABEL, DIMENSIONES_PROCESO, DIMENSIONES_EMPRESA, type Dimension } from "@/lib/pemm/descriptores";
import { PEMMRadar } from "@/components/pemm/PEMMRadar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TYPE_SCALE, SPACING_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import type { Arquetipo, Database } from "@/lib/supabase/types";

type PemmEvaluacion = Database["public"]["Tables"]["pemm_evaluaciones"]["Row"];

interface DiagnosticoConsolidadoProps {
  proyectoId: string;
  arquetipo: Arquetipo;
  puntajeTotal: number;
  alertaGobierno: boolean;
  evaluacionesPemm: PemmEvaluacion[];
}

export function DiagnosticoConsolidado({
  proyectoId,
  arquetipo,
  puntajeTotal,
  alertaGobierno,
  evaluacionesPemm,
}: DiagnosticoConsolidadoProps) {
  const info = ARQUETIPO_INFO[arquetipo];

  return (
    <div className={cn("flex max-w-4xl flex-col", SPACING_SCALE.xl)}>
      {/* Bloque 2.3 — banner de alto contraste: es el hallazgo de mayor consecuencia
          del instrumento, no debe leerse como un badge más. */}
      {alertaGobierno && (
        <div className="flex items-start gap-4 rounded-lg border-l-4 border-destructive bg-destructive/15 p-5 text-destructive">
          <AlertTriangle className="mt-0.5 size-7 shrink-0" />
          <div className={cn("flex flex-col", SPACING_SCALE.xs)}>
            <p className="text-base font-bold">Alerta de gobierno societario — requiere validar con el cliente</p>
            <p className={cn(TYPE_SCALE.body, "leading-relaxed text-foreground")}>
              La respuesta a la pregunta 6 indica que la estructura de decisión es difusa o hay conflicto de
              autoridad. Es posible que el problema real no sea de procesos sino de gobierno corporativo —
              exploren esto antes de avanzar con la ruta de intervención.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className={TYPE_SCALE.h1}>{info.titulo}</CardTitle>
          <Badge className="bg-primary text-primary-foreground">Puntaje: {puntajeTotal}</Badge>
        </CardHeader>
        <CardContent>
          <p className={cn(TYPE_SCALE.body, "leading-relaxed text-foreground")}>{info.descripcion}</p>
        </CardContent>
      </Card>

      {evaluacionesPemm.map((ev) => {
        const dimensiones: Dimension[] = ev.tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;
        const evidencias = (ev.evidencias ?? {}) as Record<string, string>;
        const tieneEvidencias = Object.values(evidencias).some((v) => v && v.trim().length > 0);

        return (
          <Card key={ev.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={TYPE_SCALE.h2}>
                {ev.tipo === "proceso" ? ev.proceso_evaluado ?? "Proceso evaluado" : "Capacidades de empresa"}
              </CardTitle>
              <Badge className="bg-secondary/30 text-foreground">Nivel {ev.nivel_resultante} (mínimo)</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PEMMRadar
                dimensiones={dimensiones}
                valores={Object.fromEntries(dimensiones.map((d) => [d, ev[d]]))}
                // Bloque 2.3 — hook de benchmark listo, sin dato real todavía: no se fabrica
                // un número de "benchmark sectorial" que no existe en la app hoy.
                benchmark={undefined}
              />
              <div className={cn("flex flex-col", SPACING_SCALE.sm)}>
                <span className={cn(TYPE_SCALE.meta, "font-medium text-foreground")}>Evidencias por dimensión</span>
                {dimensiones.map((d) => (
                  <div key={d} className="flex flex-col gap-0.5 border-b border-border py-1.5 last:border-none">
                    <div className="flex items-center justify-between">
                      <span className={TYPE_SCALE.meta}>{DIMENSION_LABEL[d]}</span>
                      <Badge className="bg-muted">{ev[d] ?? "—"}</Badge>
                    </div>
                    {evidencias[d] && <p className={cn(TYPE_SCALE.body, "text-muted-foreground")}>{evidencias[d]}</p>}
                  </div>
                ))}
                {!tieneEvidencias && <p className={TYPE_SCALE.meta}>Sin evidencias registradas para esta evaluación.</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex gap-2">
        <Button variant="outline" render={<Link href={`/proyectos/${proyectoId}/triage`}>Rehacer triage</Link>} />
        <Button render={<Link href={`/proyectos/${proyectoId}/pemm`}>Ver diagnóstico PEMM</Link>} />
        <Button variant="outline" render={<Link href={`/proyectos/${proyectoId}`}>Volver al proyecto</Link>} />
      </div>
    </div>
  );
}
