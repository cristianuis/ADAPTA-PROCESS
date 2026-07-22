import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTriage } from "@/lib/actions/triage";
import { listarEvaluacionesPemm } from "@/lib/actions/pemm";
import { DiagnosticoConsolidado } from "@/components/triage/DiagnosticoConsolidado";
import { TYPE_SCALE } from "@/lib/design/tokens";

export default async function ResultadoTriagePage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const [triage, evaluacionesPemm] = await Promise.all([
    obtenerTriage(proyectoId),
    listarEvaluacionesPemm(proyectoId),
  ]);
  if (!triage) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className={TYPE_SCALE.h1}>Resultado — {proyecto.nombre}</h1>
      </div>
      <DiagnosticoConsolidado
        proyectoId={proyectoId}
        arquetipo={triage.arquetipo_sugerido}
        puntajeTotal={triage.puntaje_total}
        alertaGobierno={triage.alerta_gobierno}
        evaluacionesPemm={evaluacionesPemm.filter((ev) => ev.estado === "respondida")}
      />
    </div>
  );
}
