import { ClienteForm } from "@/components/clientes/ClienteForm";

export default function NuevoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">Registra la empresa antes de crear un proyecto.</p>
      </div>
      <ClienteForm />
    </div>
  );
}
