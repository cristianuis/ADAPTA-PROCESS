import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerCliente } from "@/lib/actions/clientes";
import { listarEntregables } from "@/lib/actions/entregables";
import { getConsultorActual } from "@/lib/actions/consultores";
import { GenerarInformeDiagnostico } from "@/components/entregables/GenerarInformeDiagnostico";
import { GenerarPropuestaComercial } from "@/components/entregables/GenerarPropuestaComercial";
import { GenerarManualProcesos } from "@/components/entregables/GenerarManualProcesos";
import { CalculadoraTarifa } from "@/components/entregables/CalculadoraTarifa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EntregablesPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const [cliente, entregables, { consultor }] = await Promise.all([
    obtenerCliente(proyecto.cliente_id),
    listarEntregables(proyectoId),
    getConsultorActual(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entregables — {proyecto.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Todo texto redactado por IA queda editable antes de exportar — nunca se genera un documento final directo.
        </p>
      </div>

      {entregables.length > 0 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Historial de entregables generados</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {entregables.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span>{e.nombre}</span>
                <Badge className="bg-muted">v{e.version}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <GenerarInformeDiagnostico proyectoId={proyectoId} />
      <GenerarPropuestaComercial
        proyectoId={proyectoId}
        arquetipo={proyecto.arquetipo}
        numEmpleados={cliente?.num_empleados ?? null}
        tarifaHoraDefault={consultor?.tarifa_hora_objetivo ?? 100000}
      />
      <GenerarManualProcesos proyectoId={proyectoId} />
      <CalculadoraTarifa />
    </div>
  );
}
