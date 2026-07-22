import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTableroIndicadores } from "@/lib/actions/mediciones";
import { TendenciaChart } from "@/components/mediciones/TendenciaChart";
import { RegistrarMedicionForm } from "@/components/mediciones/RegistrarMedicionForm";
import { SemaforoBadge } from "@/components/mediciones/SemaforoBadge";
import { calcularSemaforo } from "@/lib/adopcion/calcular-adopcion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            const semaforo =
              ultimaMedicion?.valor !== undefined && ultimaMedicion?.valor !== null && indicador.meta !== null
                ? calcularSemaforo(ultimaMedicion.valor, indicador.meta)
                : null;

            return (
              <Card key={indicador.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{indicador.nombre}</CardTitle>
                    <p className="text-xs text-muted-foreground">{procesoNombre}</p>
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
                    <TendenciaChart mediciones={mediciones} meta={indicador.meta} />
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
