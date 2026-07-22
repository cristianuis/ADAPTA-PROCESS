import { notFound } from "next/navigation";
import { obtenerAuditoria } from "@/lib/actions/auditorias";
import { AnalisisCausas } from "@/components/adopcion/AnalisisCausas";
import { DescargarInformeAdopcion } from "@/components/adopcion/DescargarInformeAdopcion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AuditoriaDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string; auditoriaId: string }>;
}) {
  const { proyectoId, auditoriaId } = await params;
  const auditoria = await obtenerAuditoria(auditoriaId);
  if (!auditoria) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{auditoria.procesos?.nombre ?? "Proceso"}</h1>
          <p className="text-sm text-muted-foreground">Auditoría del {auditoria.fecha}</p>
        </div>
        <Badge className="bg-primary text-primary-foreground text-base">{auditoria.porcentaje_adopcion}% adopción</Badge>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Resultado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            {auditoria.casos_conformes} de {auditoria.casos_revisados} casos revisados fueron conformes.
          </p>
          {auditoria.desviaciones && auditoria.desviaciones.length > 0 && (
            <div>
              <p className="font-medium">Desviaciones observadas:</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {auditoria.desviaciones.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <AnalisisCausas
        auditoriaId={auditoriaId}
        proyectoId={proyectoId}
        porcentajeAdopcion={auditoria.porcentaje_adopcion ?? 0}
        casosRevisados={auditoria.casos_revisados}
        casosConformes={auditoria.casos_conformes}
        desviaciones={auditoria.desviaciones ?? []}
        causasGuardadas={auditoria.causas_identificadas}
      />

      <DescargarInformeAdopcion auditoriaId={auditoriaId} />
    </div>
  );
}
