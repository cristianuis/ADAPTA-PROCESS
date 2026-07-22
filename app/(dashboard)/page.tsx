import Link from "next/link";
import { listarProyectos } from "@/lib/actions/proyectos";
import { FaseBadge } from "@/components/proyectos/FaseBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const proyectos = await listarProyectos();
  const activos = proyectos.filter((p) => p.estado !== "cerrado");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground">
            {activos.length} proyecto{activos.length === 1 ? "" : "s"} activo
            {activos.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button render={<Link href="/proyectos/nuevo">Nuevo proyecto</Link>} />
      </div>

      {activos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No tienes proyectos activos. <Link href="/clientes/nuevo" className="underline">Registra un cliente</Link> para empezar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activos.map((proyecto) => (
            <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{proyecto.nombre}</CardTitle>
                  <FaseBadge estado={proyecto.estado} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{proyecto.clientes?.razon_social}</p>
                  {proyecto.arquetipo && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Arquetipo {proyecto.arquetipo}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
