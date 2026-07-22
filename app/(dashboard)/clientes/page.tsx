import Link from "next/link";
import { listarClientes } from "@/lib/actions/clientes";
import { ClientesTable } from "@/components/clientes/ClientesTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clientes = await listarClientes(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clientes.length} cliente{clientes.length === 1 ? "" : "s"} registrado
            {clientes.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button render={<Link href="/clientes/nuevo">Nuevo cliente</Link>} />
      </div>

      <form className="max-w-sm">
        <Input type="search" name="q" placeholder="Buscar por razón social..." defaultValue={q} />
      </form>

      <ClientesTable clientes={clientes} />
    </div>
  );
}
