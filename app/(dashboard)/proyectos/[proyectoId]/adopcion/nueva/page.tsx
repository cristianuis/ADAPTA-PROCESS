import { listarProcesos } from "@/lib/actions/procesos";
import { AuditoriaForm } from "@/components/adopcion/AuditoriaForm";

export default async function NuevaAuditoriaPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const procesos = await listarProcesos(proyectoId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva auditoría de adopción</h1>
        <p className="text-sm text-muted-foreground">
          Revisa una muestra de casos reales y marca cuántos cumplen con el proceso diseñado.
        </p>
      </div>
      <AuditoriaForm proyectoId={proyectoId} procesos={procesos} />
    </div>
  );
}
