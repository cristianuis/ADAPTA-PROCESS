import { notFound } from "next/navigation";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { PEMMForm } from "@/components/pemm/PEMMForm";
import type { TipoPEMM } from "@/lib/supabase/types";

export default async function NuevaPemmPage({
  params,
  searchParams,
}: {
  params: Promise<{ proyectoId: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { proyectoId } = await params;
  const { tipo: tipoParam } = await searchParams;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const tipo: TipoPEMM = tipoParam === "empresa" ? "empresa" : "proceso";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {tipo === "proceso" ? "Evaluar un proceso" : "Evaluar capacidades de empresa"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Califica cada dimensión en escala 1-4 según el descriptor que mejor describa la situación observada.
        </p>
      </div>
      <PEMMForm proyectoId={proyectoId} tipo={tipo} />
    </div>
  );
}
