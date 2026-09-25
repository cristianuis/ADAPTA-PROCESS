import { notFound } from "next/navigation";
import { listarHallazgos } from "@/lib/actions/hallazgos";
import { listarProcesos } from "@/lib/actions/procesos";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { HallazgoForm } from "@/components/hallazgos/HallazgoForm";
import { MatrizPriorizacion } from "@/components/hallazgos/MatrizPriorizacion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SPACING_SCALE, TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export default async function HallazgosPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const [hallazgos, procesos] = await Promise.all([listarHallazgos(proyectoId), listarProcesos(proyectoId)]);
  const nombresProceso = new Map(procesos.map((proceso) => [proceso.id, proceso.nombre]));

  return (
    <div className={cn("flex min-w-0 flex-col", SPACING_SCALE.xl)}>
      <div className={cn("flex flex-col items-stretch sm:flex-row sm:items-start sm:justify-between", SPACING_SCALE.lg)}>
        <div className="min-w-0">
          <h1 className={cn(TYPE_SCALE.h1, "break-words")}>Hallazgos — {proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">Matriz de priorización Impacto × Esfuerzo.</p>
        </div>
        <HallazgoForm proyectoId={proyectoId} procesos={procesos.map(({ id, nombre }) => ({ id, nombre }))} />
      </div>

      {hallazgos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay hallazgos. Agrégalos manualmente o valídalos desde el análisis de entrevistas.
        </p>
      ) : (
        <>
          <MatrizPriorizacion hallazgos={hallazgos} />
          <div className="min-w-0 overflow-hidden rounded-md border border-border max-sm:border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proceso</TableHead>
                  <TableHead>Impacto</TableHead>
                  <TableHead>Esfuerzo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Evidencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hallazgos.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell data-label="Título" className="font-medium">{h.titulo}</TableCell>
                    <TableCell data-label="Categoría">{h.categoria ?? "—"}</TableCell>
                    <TableCell data-label="Proceso">{h.proceso_id ? nombresProceso.get(h.proceso_id) ?? "No disponible" : "Transversal"}</TableCell>
                    <TableCell data-label="Impacto">{h.impacto}</TableCell>
                    <TableCell data-label="Esfuerzo">{h.esfuerzo}</TableCell>
                    <TableCell data-label="Origen">
                      <Badge className={h.origen === "ia" ? "bg-secondary/30" : "bg-muted"}>
                        {h.origen === "ia" ? "IA (validado)" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell data-label="Evidencia">
                      <div className="flex flex-col items-start gap-1">
                        <Badge className={h.estado_evidencia === "cita_verificada" ? "bg-success/20 text-success" : h.estado_evidencia === "validado_consultor" ? "bg-secondary/30" : "bg-muted"}>
                          {h.estado_evidencia === "cita_verificada" ? "Cita cotejada" : h.estado_evidencia === "validado_consultor" ? "Revisada por consultor" : h.cita_soporte ? "Pendiente de revisar" : "Sin evidencia"}
                        </Badge>
                        {h.cita_soporte && (
                          <details className="max-w-64 text-xs text-muted-foreground">
                            <summary className="cursor-pointer underline underline-offset-2">Ver soporte</summary>
                            <p className="mt-1 whitespace-normal">{h.cita_soporte}</p>
                          </details>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
