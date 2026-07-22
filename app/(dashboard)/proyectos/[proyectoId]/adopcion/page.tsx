import Link from "next/link";
import { notFound } from "next/navigation";
import { listarAuditorias } from "@/lib/actions/auditorias";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdopcionPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const auditorias = await listarAuditorias(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoría de adopción — {proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">¿Se está usando lo que se diseñó?</p>
        </div>
        <Button render={<Link href={`/proyectos/${proyectoId}/adopcion/nueva`}>Nueva auditoría</Link>} />
      </div>

      {auditorias.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay auditorías de adopción registradas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auditorias.map((a) => (
            <Link key={a.id} href={`/proyectos/${proyectoId}/adopcion/${a.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{a.procesos?.nombre ?? "Proceso"}</CardTitle>
                  <Badge
                    className={
                      (a.porcentaje_adopcion ?? 0) >= 80
                        ? "bg-success/20 text-success"
                        : (a.porcentaje_adopcion ?? 0) >= 50
                          ? "bg-secondary/40"
                          : "bg-destructive/20 text-destructive"
                    }
                  >
                    {a.porcentaje_adopcion}%
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {a.fecha} · {a.casos_conformes}/{a.casos_revisados} casos conformes
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
