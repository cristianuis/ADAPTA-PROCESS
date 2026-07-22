import Link from "next/link";
import { notFound } from "next/navigation";
import { listarProcesos } from "@/lib/actions/procesos";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { MapaProcesos } from "@/components/procesos/MapaProcesos";
import { Button } from "@/components/ui/button";

export default async function ProcesosPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const procesos = await listarProcesos(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mapa de procesos — {proyecto.nombre}</h1>
          <p className="text-sm text-muted-foreground">Clasificación Nivel 0: estratégicos, misionales, apoyo.</p>
        </div>
        <Button render={<Link href={`/proyectos/${proyectoId}/procesos/nuevo`}>Nuevo proceso</Link>} />
      </div>

      {procesos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay procesos identificados.
        </p>
      ) : (
        <MapaProcesos procesos={procesos} proyectoId={proyectoId} />
      )}
    </div>
  );
}
