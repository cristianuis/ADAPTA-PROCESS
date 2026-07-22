import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MatrizRaci } from "@/lib/procesos/generar-raci";

const LETRA_CLASE: Record<string, string> = {
  R: "bg-primary/20 text-primary font-semibold",
  A: "bg-secondary/30 text-foreground font-semibold",
  C: "bg-muted text-muted-foreground",
  I: "bg-muted/50 text-muted-foreground",
};

export function RaciTable({ matriz }: { matriz: MatrizRaci }) {
  if (matriz.roles.length === 0) {
    return <p className="text-sm text-muted-foreground">Asigna roles en las actividades para ver la matriz RACI.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Actividad</TableHead>
            {matriz.roles.map((rol) => (
              <TableHead key={rol} className="text-center">
                {rol}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {matriz.filas.map((fila) => (
            <TableRow key={fila.orden}>
              <TableCell className="font-medium">{fila.actividad}</TableCell>
              {matriz.roles.map((rol) => (
                <TableCell key={rol} className={`text-center ${fila.celdas[rol] ? LETRA_CLASE[fila.celdas[rol]] : ""}`}>
                  {fila.celdas[rol] || "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
