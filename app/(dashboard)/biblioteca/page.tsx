import { listarPlantillas } from "@/lib/actions/plantillas";
import { listarBenchmarks } from "@/lib/actions/benchmarks";
import { BenchmarkForm } from "@/components/biblioteca/BenchmarkForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function BibliotecaPage() {
  const [plantillas, benchmarks] = await Promise.all([listarPlantillas(), listarBenchmarks()]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca de conocimiento</h1>
        <p className="text-sm text-muted-foreground">
          El activo que se vuelve más valioso con cada proyecto — plantillas y benchmarks reutilizables entre clientes.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Plantillas de proceso</h2>
        {plantillas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no has guardado ninguna plantilla. Desde la ficha de un proceso, usa &quot;Guardar como plantilla&quot;.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plantillas.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.nombre}</CardTitle>
                  <Badge className="bg-muted">usada {p.veces_usada}x</Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {p.sector ?? "Sector sin definir"}
                  {p.descripcion && <p className="mt-1">{p.descripcion}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Benchmarks sectoriales</h2>
          <BenchmarkForm />
        </div>
        {benchmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay benchmarks registrados.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead>Indicador</TableHead>
                  <TableHead>P25</TableHead>
                  <TableHead>Mediana</TableHead>
                  <TableHead>P75</TableHead>
                  <TableHead>N.º obs.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.sector}</TableCell>
                    <TableCell>{b.indicador}</TableCell>
                    <TableCell>{b.valor_p25 ?? "—"}</TableCell>
                    <TableCell>{b.valor_mediana ?? "—"}</TableCell>
                    <TableCell>{b.valor_p75 ?? "—"}</TableCell>
                    <TableCell>{b.num_observaciones}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
