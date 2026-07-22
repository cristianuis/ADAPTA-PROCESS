import { listarClientes } from "@/lib/actions/clientes";
import { ProyectoForm } from "@/components/proyectos/ProyectoForm";

export default async function NuevoProyectoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>;
}) {
  const { clienteId } = await searchParams;
  const clientes = await listarClientes();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo proyecto</h1>
        <p className="text-sm text-muted-foreground">Empieza en fase &quot;Prospecto&quot;.</p>
      </div>
      <ProyectoForm clientes={clientes} clienteIdPreseleccionado={clienteId} />
    </div>
  );
}
