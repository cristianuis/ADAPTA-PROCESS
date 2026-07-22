import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTriage } from "@/lib/actions/triage";
import { ArquetipoResultado } from "@/components/triage/ArquetipoResultado";

export default async function ResultadoTriagePage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const triage = await obtenerTriage(proyectoId);
  if (!triage) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resultado — {proyecto.nombre}</h1>
      </div>
      <ArquetipoResultado
        proyectoId={proyectoId}
        arquetipo={triage.arquetipo_sugerido}
        puntajeTotal={triage.puntaje_total}
        alertaGobierno={triage.alerta_gobierno}
      />
    </div>
  );
}
