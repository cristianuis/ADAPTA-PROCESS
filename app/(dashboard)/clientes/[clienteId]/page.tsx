import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerCliente, listarProyectosDeCliente } from "@/lib/actions/clientes";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaseBadge } from "@/components/proyectos/FaseBadge";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const cliente = await obtenerCliente(clienteId);

  if (!cliente) notFound();

  const proyectos = await listarProyectosDeCliente(clienteId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.razon_social}</h1>
          <p className="text-sm text-muted-foreground">{cliente.sector ?? "Sector sin definir"}</p>
        </div>
        <Button
          render={<Link href={`/proyectos/nuevo?clienteId=${cliente.id}`}>Nuevo proyecto</Link>}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          {proyectos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este cliente todavía no tiene proyectos.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proyectos.map((proyecto) => (
                <li key={proyecto.id}>
                  <Link
                    href={`/proyectos/${proyecto.id}`}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{proyecto.nombre}</span>
                    <FaseBadge estado={proyecto.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Editar información</h2>
        <ClienteForm
          clienteId={cliente.id}
          defaultValues={{
            razonSocial: cliente.razon_social,
            nit: cliente.nit ?? "",
            sector: cliente.sector ?? "",
            subsector: cliente.subsector ?? "",
            numEmpleados: cliente.num_empleados,
            facturacionAnual: cliente.facturacion_anual,
            ciudad: cliente.ciudad ?? "",
            contactoNombre: cliente.contacto_nombre ?? "",
            contactoCargo: cliente.contacto_cargo ?? "",
            contactoEmail: cliente.contacto_email ?? "",
            contactoTelefono: cliente.contacto_telefono ?? "",
            notas: cliente.notas ?? "",
          }}
        />
      </div>
    </div>
  );
}
