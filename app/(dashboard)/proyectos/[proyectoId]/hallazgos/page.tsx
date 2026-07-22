import { notFound } from "next/navigation";
import { listarHallazgos } from "@/lib/actions/hallazgos";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { HallazgoForm } from "@/components/hallazgos/HallazgoForm";
import { MatrizPriorizacion } from "@/components/hallazgos/MatrizPriorizacion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function HallazgosPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const hallazgos = await listarHallazgos(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hallazgos — {proyecto.nombre}</h1>
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
          <div className="overflow-hidden rounded-md border border-border">
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
                    <TableCell className="font-medium">{h.titulo}</TableCell>
                    <TableCell>{h.categoria ?? "—"}</TableCell>
                    <TableCell>{h.impacto}</TableCell>
                    <TableCell>{h.esfuerzo}</TableCell>
                    <TableCell>
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
