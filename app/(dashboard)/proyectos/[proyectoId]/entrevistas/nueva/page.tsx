import { EntrevistaForm } from "@/components/entrevistas/EntrevistaForm";

export default async function NuevaEntrevistaPage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva entrevista</h1>
        <p className="text-sm text-muted-foreground">
          Registra al entrevistado. Puedes pegar la transcripción ahora o después.
        </p>
      </div>
      <EntrevistaForm proyectoId={proyectoId} />
    </div>
  );
}
