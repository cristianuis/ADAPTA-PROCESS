import { notFound } from "next/navigation";
import { obtenerEvaluacionPemm } from "@/lib/actions/pemm";
import { PEMMRadar } from "@/components/pemm/PEMMRadar";
import { DIMENSIONES_PROCESO, DIMENSIONES_EMPRESA, DIMENSION_LABEL } from "@/lib/pemm/descriptores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PemmDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string; pemmId: string }>;
}) {
  const { pemmId } = await params;
  const evaluacion = await obtenerEvaluacionPemm(pemmId);
  if (!evaluacion) notFound();

  const dimensiones = evaluacion.tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {evaluacion.tipo === "proceso" ? evaluacion.proceso_evaluado : "Capacidades de empresa"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {evaluacion.estado === "respondida"
            ? `Nivel resultante: ${evaluacion.nivel_resultante} (mínimo de sus dimensiones)`
            : "Encuesta pendiente de respuesta"}
        </p>
      </div>

      {evaluacion.estado === "respondida" && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Radar de dimensiones</CardTitle>
          </CardHeader>
          <CardContent>
            <PEMMRadar
              dimensiones={dimensiones}
              valores={Object.fromEntries(dimensiones.map((d) => [d, evaluacion[d]]))}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {dimensiones.map((d) => (
                <div key={d} className="flex justify-between border-b border-border py-1">
                  <span className="text-muted-foreground">{DIMENSION_LABEL[d]}</span>
                  <span className="font-medium">{evaluacion[d] ?? "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {evaluacion.evidencias && Object.keys(evaluacion.evidencias).length > 0 && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Evidencias registradas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {Object.entries(evaluacion.evidencias).map(([dim, texto]) =>
              texto ? (
                <div key={dim}>
                  <span className="font-medium">{DIMENSION_LABEL[dim as keyof typeof DIMENSION_LABEL]}:</span>{" "}
                  <span className="text-muted-foreground">{texto}</span>
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
