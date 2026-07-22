import { ProcesoForm } from "@/components/procesos/ProcesoForm";
import { UsarPlantilla } from "@/components/biblioteca/UsarPlantilla";
import { listarPlantillas } from "@/lib/actions/plantillas";

export default async function NuevoProcesoPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const plantillas = await listarPlantillas();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo proceso</h1>
        <p className="text-sm text-muted-foreground">Identifica el proceso antes de diseñar su SIPOC y actividades.</p>
      </div>
      <UsarPlantilla proyectoId={proyectoId} plantillas={plantillas} />
      <ProcesoForm proyectoId={proyectoId} />
    </div>
  );
}
