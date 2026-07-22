import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTriage } from "@/lib/actions/triage";
import { FaseBadge } from "@/components/proyectos/FaseBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);

  if (!proyecto) notFound();

  const triage = await obtenerTriage(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente:{" "}
            <Link href={`/clientes/${proyecto.clientes?.id}`} className="hover:underline">
              {proyecto.clientes?.razon_social}
            </Link>
          </p>
        </div>
        <FaseBadge estado={proyecto.estado} />
      </div>

      <nav className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/pemm`}>Diagnóstico PEMM</Link>}
        />
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/entrevistas`}>Entrevistas</Link>}
        />
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/hallazgos`}>Hallazgos</Link>}
        />
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/procesos`}>Procesos</Link>}
        />
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/tablero`}>Tablero</Link>}
        />
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/adopcion`}>Adopción</Link>}
        />
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/proyectos/${proyecto.id}/entregables`}>Entregables</Link>}
        />
      </nav>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Triage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {triage ? (
            <>
              <p className="text-sm text-muted-foreground">
                Arquetipo sugerido: <span className="font-semibold text-foreground">{triage.arquetipo_sugerido}</span>{" "}
                (puntaje {triage.puntaje_total})
              </p>
              <Button
                className="self-start"
                render={
                  <Link href={`/proyectos/${proyecto.id}/triage/resultado`}>
                    Ver resultado completo
                  </Link>
                }
              />
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Este proyecto todavía no tiene triage aplicado.
              </p>
              <Button
                className="self-start"
                render={<Link href={`/proyectos/${proyecto.id}/triage`}>Iniciar triage</Link>}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
