import { getConsultorActual } from "@/lib/actions/consultores";
import { PerfilForm } from "@/components/perfil/PerfilForm";

export default async function PerfilPage() {
  const { consultor, user } = await getConsultorActual();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Configura tu marca como consultor.</p>
      </div>
      <PerfilForm
        defaultValues={{
          nombre: consultor?.nombre ?? "",
          empresa: consultor?.empresa ?? "",
          colorPrimario: consultor?.color_primario ?? "#1A4731",
          colorSecundario: consultor?.color_secundario ?? "#C8D830",
          tarifaHoraObjetivo: consultor?.tarifa_hora_objetivo?.toString() ?? "",
        }}
      />
      <p className="text-xs text-muted-foreground">Sesión: {user.email}</p>
    </div>
  );
}
