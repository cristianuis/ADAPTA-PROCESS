import Link from "next/link";
import { listarEvaluacionesPemm } from "@/lib/actions/pemm";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { InvitarPemmForm } from "@/components/pemm/InvitarPemmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export default async function PemmPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const evaluaciones = await listarEvaluacionesPemm(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diagnóstico PEMM — {proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Madurez de procesos (Hammer): el nivel de cada evaluación es el mínimo de sus habilitadores.
          </p>
        </div>
        <div className="flex gap-2">
          <InvitarPemmForm proyectoId={proyectoId} />
          <Button render={<Link href={`/proyectos/${proyectoId}/pemm/nueva?tipo=proceso`}>Evaluar proceso</Link>} />
          <Button
            variant="outline"
            render={<Link href={`/proyectos/${proyectoId}/pemm/nueva?tipo=empresa`}>Evaluar empresa</Link>}
          />
        </div>
      </div>

      <Button
        variant="outline"
        className="self-start"
        render={<Link href={`/proyectos/${proyectoId}/pemm/comparativa`}>Ver comparativa dirección vs. operación</Link>}
      />

      {evaluaciones.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay evaluaciones PEMM en este proyecto.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evaluaciones.map((ev) => (
            <Link key={ev.id} href={`/proyectos/${proyectoId}/pemm/${ev.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {ev.tipo === "proceso" ? ev.proceso_evaluado || "Proceso" : "Capacidades de empresa"}
                  </CardTitle>
                  <Badge className={ev.estado === "respondida" ? "bg-success/20 text-success" : "bg-muted"}>
                    {ev.estado === "respondida" ? `Nivel ${ev.nivel_resultante ?? "—"}` : "Pendiente"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {ev.fuente === "consultor" ? "Evaluación del consultor" : `Encuesta — ${ev.respondiente_nivel ?? ""}`}
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
