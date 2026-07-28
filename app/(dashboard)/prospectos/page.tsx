import { listarProspectosDemo } from "@/lib/actions/prospectos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const PERFIL_LABEL: Record<string, string> = {
  dependencia_operativa: "Dependencia operativa",
  transicion_operativa: "Transición operativa",
  sistema_en_desarrollo: "Sistema en desarrollo",
};

export default async function ProspectosPage() {
  const prospectos = await listarProspectosDemo();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prospectos</h1>
        <p className="text-sm text-muted-foreground">
          Personas que iniciaron el pulso operativo desde el portafolio.
        </p>
      </div>

      {prospectos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Todavía no hay prospectos registrados.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospectos.map((prospecto) => (
              <TableRow key={prospecto.id}>
                <TableCell data-label="Fecha">
                  {new Intl.DateTimeFormat("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Bogota",
                  }).format(new Date(prospecto.created_at))}
                </TableCell>
                <TableCell data-label="Nombre" className="font-medium">
                  {prospecto.nombre}
                </TableCell>
                <TableCell data-label="Empresa">{prospecto.empresa}</TableCell>
                <TableCell data-label="Correo">
                  <a href={`mailto:${prospecto.email}`} className="hover:underline">
                    {prospecto.email}
                  </a>
                </TableCell>
                <TableCell data-label="Resultado">
                  {prospecto.perfil ? (
                    <Badge className="bg-primary/15 text-primary">
                      {PERFIL_LABEL[prospecto.perfil] ?? prospecto.perfil} ·{" "}
                      {prospecto.puntaje}/10
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">
                      Iniciado
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
