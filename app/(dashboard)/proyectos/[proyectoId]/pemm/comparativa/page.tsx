import { obtenerComparativaPemm } from "@/lib/actions/pemm";
import { ComparativaPercepcion } from "@/components/pemm/ComparativaPercepcion";

export default async function ComparativaPemmPage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const datos = await obtenerComparativaPemm(proyectoId);

  const hayDatos = datos.some((d) => d.direccion !== null || d.mando_medio !== null || d.operacion !== null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparativa de percepción</h1>
        <p className="text-sm text-muted-foreground">
          Dirección vs. mando medio vs. operación — la discrepancia entre niveles es un hallazgo en sí mismo.
        </p>
      </div>
      {hayDatos ? (
        <ComparativaPercepcion datos={datos} />
      ) : (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay encuestas respondidas por más de un nivel jerárquico. Genera invitaciones desde la lista de
          PEMM.
        </p>
      )}
    </div>
  );
}
