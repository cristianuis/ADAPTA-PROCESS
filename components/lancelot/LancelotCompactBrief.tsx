import { AlertTriangle, CheckCircle2, ChevronDown, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RespuestaLancelot } from "@/lib/lancelot/types";

export function LancelotCompactBrief({ salida }: { salida: RespuestaLancelot }) {
  const acciones = salida.acciones.slice(0, 2);

  return (
    <div className="space-y-4">
      <Card className="border-primary/25 bg-primary text-primary-foreground ring-0">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/65">
            Preparación recomendada
          </p>
          <CardTitle className="mt-2 text-xl text-primary-foreground">{salida.prioridad.titulo}</CardTitle>
          <p className="leading-6 text-primary-foreground/75">{salida.prioridad.por_que_ahora}</p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {acciones.map((accion, index) => (
              <li key={`${accion.tarea}-${index}`} className="flex gap-3 rounded-xl bg-white/10 p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-bold text-secondary-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{accion.tarea}</p>
                  <p className="mt-1 text-sm text-primary-foreground/70">{accion.resultado}</p>
                  <p className="mt-2 text-xs font-semibold text-secondary">{accion.tiempo_estimado}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
          <div className="rounded-xl bg-muted p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-primary" /> Señal de que terminaste
            </p>
            <p className="mt-2 text-sm">{salida.indicador.nombre}: {salida.indicador.meta}</p>
          </div>
          <div className="rounded-xl bg-success/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4 text-success" /> Resultado esperado
            </p>
            <p className="mt-2 text-sm">{salida.prioridad.resultado_esperado}</p>
          </div>
        </CardContent>
      </Card>

      <details className="group rounded-xl border bg-card px-4 py-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
          Ver análisis, evidencia y riesgos
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
          <div>
            <p className="font-medium">Lectura de Lancelot</p>
            <p className="mt-2 leading-6 text-muted-foreground">{salida.lectura}</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {salida.evidencia.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          {salida.riesgos.length > 0 && (
            <div>
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4 text-amber-600" /> Riesgos a vigilar
              </p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {salida.riesgos.map((riesgo) => <li key={riesgo}>• {riesgo}</li>)}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
