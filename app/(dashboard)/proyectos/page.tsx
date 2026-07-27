import Link from "next/link";
import { listarProyectos } from "@/lib/actions/proyectos";
import { ProyectoKanban } from "@/components/proyectos/ProyectoKanban";
import { Button } from "@/components/ui/button";

export default async function ProyectosPage() {
  const proyectos = await listarProyectos();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight break-words">Proyectos</h1>
          <p className="text-sm text-muted-foreground">Organizados por fase del modelo ADAPTA.</p>
        </div>
        <Button render={<Link href="/proyectos/nuevo">Nuevo proyecto</Link>} />
      </div>

      {proyectos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No hay proyectos todavía.
        </p>
      ) : (
        <ProyectoKanban proyectos={proyectos} />
      )}
    </div>
  );
}
