import { obtenerPemmPorToken } from "@/lib/actions/pemm";
import { EncuestaPublicaForm } from "@/components/pemm/EncuestaPublicaForm";

export default async function EncuestaPemmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const registro = await obtenerPemmPorToken(token);

  if (!registro) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">Este enlace no es válido.</p>
      </div>
    );
  }

  if (registro.estado === "respondida") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">Esta encuesta ya fue respondida. Gracias.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-10">
      <EncuestaPublicaForm token={token} tipo={registro.tipo} procesoEvaluado={registro.proceso_evaluado} />
    </div>
  );
}
