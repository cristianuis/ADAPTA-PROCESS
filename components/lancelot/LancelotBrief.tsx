import { AlertTriangle, ArrowRight, CheckCircle2, Gauge, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RespuestaLancelot } from "@/lib/lancelot/types";

export function LancelotBrief({ salida, numero }: { salida: RespuestaLancelot; numero: number }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/25 bg-primary text-primary-foreground ring-0">
        <CardHeader className="border-b border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge className="bg-secondary text-secondary-foreground">Vuelta {numero}</Badge>
            <span className="text-xs text-primary-foreground/70">Prioridad recomendada</span>
          </div>
          <CardTitle className="mt-3 text-xl text-primary-foreground">{salida.prioridad.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/65">Por qué ahora</p>
            <p className="mt-2 leading-6">{salida.prioridad.por_que_ahora}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/65">Resultado esperado</p>
            <p className="mt-2 leading-6">{salida.prioridad.resultado_esperado}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="size-4 text-primary" />Plan de acción</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {salida.acciones.map((accion, index) => (
                <li key={`${accion.tarea}-${index}`} className="grid grid-cols-[2rem_1fr] gap-3 rounded-lg border p-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">{index + 1}</span>
                  <div>
                    <p className="font-medium">{accion.tarea}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{accion.resultado}</p>
                    <p className="mt-2 text-xs font-medium text-primary">{accion.tiempo_estimado}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="size-4 text-primary" />Cómo verificar</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium">{salida.indicador.nombre}</p>
              <p className="mt-1 text-sm text-muted-foreground">Meta: {salida.indicador.meta}</p>
              <p className="mt-2 text-xs font-medium text-primary">Revisar: {salida.indicador.momento_revision}</p>
            </CardContent>
          </Card>

          {salida.riesgos.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" />Supuestos y riesgos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {salida.riesgos.map((riesgo) => <p key={riesgo} className="text-sm text-muted-foreground">• {riesgo}</p>)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-5 pt-0 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="size-4 text-success" />Lectura de Lancelot</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{salida.lectura}</p>
            <ul className="mt-3 space-y-1">
              {salida.evidencia.map((item) => <li key={item} className="text-xs text-muted-foreground">• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><ArrowRight className="size-4 text-primary" />Pregunta para la siguiente vuelta</p>
            <p className="mt-2 text-sm leading-6">{salida.siguiente_pregunta}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

