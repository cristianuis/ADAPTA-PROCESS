import Link from "next/link";
import { notFound } from "next/navigation";
import { listarEntrevistas } from "@/lib/actions/entrevistas";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NIVEL_LABEL: Record<string, string> = { direccion: "Dirección", mando_medio: "Mando medio", operacion: "Operación" };

export default async function EntrevistasPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const entrevistas = await listarEntrevistas(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrevistas — {proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">Levantamiento asistido por IA.</p>
        </div>
        <Button render={<Link href={`/proyectos/${proyectoId}/entrevistas/nueva`}>Nueva entrevista</Link>} />
      </div>

      {entrevistas.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay entrevistas registradas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entrevistas.map((e) => (
            <Link key={e.id} href={`/proyectos/${proyectoId}/entrevistas/${e.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{e.entrevistado_nombre}</CardTitle>
                  {e.hallazgos_ia && <Badge className="bg-success/20 text-success">Analizada</Badge>}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {e.entrevistado_cargo} · {NIVEL_LABEL[e.nivel ?? ""] ?? "—"}
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
