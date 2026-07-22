import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTriage } from "@/lib/actions/triage";
import { TriageForm } from "@/components/triage/TriageForm";

export default async function TriagePage({
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Triage — {proyecto.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Responde las 6 preguntas para calcular el arquetipo de intervención recomendado.
        </p>
      </div>
      <TriageForm
        proyectoId={proyectoId}
        defaultValues={
          triage
            ? {
                p1: triage.p1_documentacion_existe,
                p2: triage.p2_documentacion_se_usa,
                p3: triage.p3_se_mide_desempeno,
                p4: triage.p4_duenos_proceso,
                p5: triage.p5_disparador,
                p6: triage.p6_estructura_decision,
                notas: triage.notas ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
