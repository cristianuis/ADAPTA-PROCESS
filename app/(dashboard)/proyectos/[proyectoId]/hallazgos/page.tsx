import { notFound } from "next/navigation";
import { listarHallazgos } from "@/lib/actions/hallazgos";
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

  const hallazgos = await listarHallazgos(proyectoId);

  return (
    <div className={cn("flex min-w-0 flex-col", SPACING_SCALE.xl)}>
      <div className={cn("flex flex-col items-stretch sm:flex-row sm:items-start sm:justify-between", SPACING_SCALE.lg)}>
        <div className="min-w-0">
          <h1 className={cn(TYPE_SCALE.h1, "break-words")}>Hallazgos — {proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">Matriz de priorización Impacto × Esfuerzo.</p>
        </div>
        <HallazgoForm proyectoId={proyectoId} />
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
                  <TableHead>Impacto</TableHead>
                  <TableHead>Esfuerzo</TableHead>
                  <TableHead>Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hallazgos.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell data-label="Título" className="font-medium">{h.titulo}</TableCell>
                    <TableCell data-label="Categoría">{h.categoria ?? "—"}</TableCell>
                    <TableCell data-label="Impacto">{h.impacto}</TableCell>
                    <TableCell data-label="Esfuerzo">{h.esfuerzo}</TableCell>
                    <TableCell data-label="Origen">
                      <Badge className={h.origen === "ia" ? "bg-secondary/30" : "bg-muted"}>
                        {h.origen === "ia" ? "IA (validado)" : "Manual"}
                      </Badge>
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
