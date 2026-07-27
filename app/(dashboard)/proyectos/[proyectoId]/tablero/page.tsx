import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTableroIndicadores } from "@/lib/actions/mediciones";
import { TendenciaChart } from "@/components/mediciones/TendenciaChart";
import { RegistrarMedicionForm } from "@/components/mediciones/RegistrarMedicionForm";
import { SemaforoBadge } from "@/components/mediciones/SemaforoBadge";
import { calcularSemaforo, type Semaforo } from "@/lib/adopcion/calcular-adopcion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SentidoIndicador } from "@/lib/supabase/types";

const SENTIDO_LABEL: Record<SentidoIndicador, string> = {
  mayor_es_mejor: "Mayor es mejor",
  menor_es_mejor: "Menor es mejor",
  rango_objetivo: "Rango objetivo",
};

export default async function TableroPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const tablero = await obtenerTableroIndicadores(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tablero de indicadores — {proyecto.nombre}</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de todos los procesos del proyecto.</p>
      </div>

      {tablero.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay indicadores definidos en ningún proceso de este proyecto.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tablero.map(({ indicador, procesoNombre, mediciones }) => {
            const ultimaMedicion = mediciones[mediciones.length - 1];
            let semaforo: Semaforo | null = null;

            if (ultimaMedicion?.valor != null) {
              if (
                indicador.sentido === "rango_objetivo" &&
                indicador.limite_inferior != null &&
                indicador.limite_superior != null
              ) {
                semaforo = calcularSemaforo(ultimaMedicion.valor, {
                  sentido: "rango_objetivo",
                  limiteInferior: indicador.limite_inferior,
                  limiteSuperior: indicador.limite_superior,
                });
              } else if (
                indicador.sentido !== "rango_objetivo" &&
                indicador.meta != null
              ) {
                semaforo = calcularSemaforo(ultimaMedicion.valor, {
                  sentido: indicador.sentido,
                  meta: indicador.meta,
                });
              }
            }

            const objetivo =
              indicador.sentido === "rango_objetivo"
                ? `${indicador.limite_inferior}–${indicador.limite_superior}`
                : indicador.meta != null
                  ? `Meta ${indicador.meta}`
                  : "Meta pendiente";

            return (
              <Card key={indicador.id}>
                <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base">{indicador.nombre}</CardTitle>
                    <p className="text-xs text-muted-foreground">{procesoNombre}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {SENTIDO_LABEL[indicador.sentido]} · {objetivo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {semaforo && <SemaforoBadge estado={semaforo} />}
                    <RegistrarMedicionForm indicadorId={indicador.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  {mediciones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin mediciones registradas.</p>
                  ) : (
                    <TendenciaChart
                      mediciones={mediciones}
                      meta={indicador.meta}
                      limiteInferior={indicador.limite_inferior}
                      limiteSuperior={indicador.limite_superior}
                    />
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
