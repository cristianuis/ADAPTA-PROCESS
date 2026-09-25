import { esAdministradorActual, getConsultorActual } from "@/lib/actions/consultores";
import { PerfilForm } from "@/components/perfil/PerfilForm";

export default async function PerfilPage() {
  const { consultor, user } = await getConsultorActual();
  const esAdministrador = await esAdministradorActual();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Configura tu marca como consultor.</p>
      </div>
      {esAdministrador ? <PerfilForm
        defaultValues={{
          nombre: consultor?.nombre ?? "",
          empresa: consultor?.empresa ?? "",
          colorPrimario: consultor?.color_primario ?? "#1A4731",
          colorSecundario: consultor?.color_secundario ?? "#C8D830",
          tarifaHoraObjetivo: consultor?.tarifa_hora_objetivo?.toString() ?? "",
          ejemplosEstilo: consultor?.ejemplos_estilo ?? "",
        }}
      /> : <p role="status" className="max-w-xl rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        Esta cuenta todavía no está habilitada como administradora de NEXUS. Solicita al administrador de la plataforma que la autorice.
      </p>}
      <p className="text-xs text-muted-foreground">Sesión: {user.email}</p>
    </div>
  );
}
