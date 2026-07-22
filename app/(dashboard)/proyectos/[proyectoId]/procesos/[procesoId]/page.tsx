import { notFound } from "next/navigation";
import { obtenerProceso } from "@/lib/actions/procesos";
import { obtenerSipoc } from "@/lib/actions/sipoc";
import { listarActividades } from "@/lib/actions/actividades";
import { listarIndicadores } from "@/lib/actions/indicadores";
import { SipocForm } from "@/components/procesos/SipocForm";
import { ActividadForm } from "@/components/procesos/ActividadForm";
import { MermaidDiagram } from "@/components/procesos/MermaidDiagram";
import { RaciTable } from "@/components/procesos/RaciTable";
import { IndicadorForm } from "@/components/procesos/IndicadorForm";
import { GuardarComoPlantilla } from "@/components/biblioteca/GuardarComoPlantilla";
import { generarDiagramaMermaid } from "@/lib/procesos/generar-mermaid";
import { generarMatrizRaci } from "@/lib/procesos/generar-raci";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ProcesoDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string; procesoId: string }>;
}) {
  const { procesoId } = await params;
  const proceso = await obtenerProceso(procesoId);
  if (!proceso) notFound();

  const [sipoc, actividades, indicadores] = await Promise.all([
    obtenerSipoc(procesoId),
    listarActividades(procesoId),
    listarIndicadores(procesoId),
  ]);

  const diagrama = generarDiagramaMermaid(proceso.nombre, actividades);
  const raci = generarMatrizRaci(actividades);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {proceso.codigo && <span className="mr-2 font-mono text-base text-muted-foreground">{proceso.codigo}</span>}
            {proceso.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">{proceso.objetivo}</p>
        </div>
        <GuardarComoPlantilla procesoId={procesoId} nombreSugerido={proceso.nombre} />
      </div>

      {/* Ficha de caracterización */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Ficha de caracterización</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Tipo:</span> {proceso.tipo}
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span> {proceso.estado}
          </div>
          <div>
            <span className="text-muted-foreground">Dueño:</span> {proceso.dueno_nombre ?? "—"} ({proceso.dueno_cargo ?? "—"})
          </div>
          <div>
            <span className="text-muted-foreground">Prioridad:</span> {proceso.prioridad ?? "—"}
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Alcance:</span> {proceso.alcance_inicio ?? "—"} → {proceso.alcance_fin ?? "—"}
          </div>
        </CardContent>
      </Card>

      <SipocForm procesoId={procesoId} sipoc={sipoc} />

      {/* Actividades */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Actividades</h2>
          <ActividadForm procesoId={procesoId} siguienteOrden={actividades.length + 1} />
        </div>
        {actividades.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividades registradas.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Aprobador</TableHead>
                  <TableHead>Valor agregado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividades.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.orden}</TableCell>
                    <TableCell className="font-medium">{a.nombre}</TableCell>
                    <TableCell>{a.rol_responsable ?? "—"}</TableCell>
                    <TableCell>{a.rol_aprobador ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={a.es_valor_agregado ? "bg-success/20 text-success" : "bg-muted"}>
                        {a.es_valor_agregado ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {actividades.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Diagrama de flujo</h2>
            <MermaidDiagram definicion={diagrama} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Matriz RACI</h2>
            <RaciTable matriz={raci} />
          </div>
        </>
      )}

      {/* Indicadores */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Indicadores (máx. 3)</h2>
          <IndicadorForm procesoId={procesoId} disabled={indicadores.length >= 3} />
        </div>
        {indicadores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin indicadores definidos.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {indicadores.map((ind) => (
              <Card key={ind.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{ind.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span>Tipo: {ind.tipo}</span>
                  <span>Fuente: {ind.fuente_datos}</span>
                  <span>Captura: {ind.mecanismo_captura}</span>
                  {ind.meta !== null && <span>Meta: {ind.meta}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
