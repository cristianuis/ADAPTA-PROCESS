import { obtenerIntakePorToken } from "@/lib/actions/entrevistas";
import { IntakeAutoservicioForm } from "@/components/entrevistas/IntakeAutoservicioForm";

export default async function IntakeAutoservicioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const registro = await obtenerIntakePorToken(token);

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
      <IntakeAutoservicioForm
        token={token}
        nombreInicial={registro.entrevistado_nombre ?? ""}
        cargoInicial={registro.entrevistado_cargo ?? ""}
      />
    </div>
  );
}
