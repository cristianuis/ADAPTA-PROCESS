import { notFound } from "next/navigation";
import { obtenerEntrevista } from "@/lib/actions/entrevistas";
import { HallazgosIAReview } from "@/components/entrevistas/HallazgosIAReview";

export default async function EntrevistaDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string; entrevistaId: string }>;
}) {
  const { entrevistaId } = await params;
  const entrevista = await obtenerEntrevista(entrevistaId);
  if (!entrevista) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{entrevista.entrevistado_nombre}</h1>
        <p className="text-sm text-muted-foreground">{entrevista.entrevistado_cargo}</p>
      </div>
      <HallazgosIAReview entrevista={entrevista} />
    </div>
  );
}
