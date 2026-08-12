import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerPlanMejora } from "@/lib/actions/mejoras";
import { PlanMejoraWorkspace } from "@/components/mejoras/PlanMejoraWorkspace";
import { SPACING_SCALE, TYPE_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export default async function MejorasPage({ params }: { params: Promise<{ proyectoId: string }> }) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();
  const plan = await obtenerPlanMejora(proyectoId);

  return <div className={cn("flex min-w-0 flex-col", SPACING_SCALE.xl)}>
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Impacto y ejecución</p>
      <h1 className={cn(TYPE_SCALE.h1, "mt-1 break-words")}>Plan de mejora — {proyecto.nombre}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Convierte los hallazgos en valor económico defendible, decisiones de intervención y resultados comprobables.</p>
    </header>
    <PlanMejoraWorkspace proyectoId={proyectoId} {...plan} />
  </div>;
}
