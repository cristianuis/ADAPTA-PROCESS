import { notFound } from "next/navigation";
import { LancelotLoop } from "@/components/lancelot/LancelotLoop";
import {
  listarProyectosLancelot,
  listarSesionesLancelot,
  obtenerSesionLancelot,
} from "@/lib/actions/lancelot";

export default async function LancelotPage({
  searchParams,
}: {
  searchParams: Promise<{ sesion?: string | string[] }>;
}) {
  const query = await searchParams;
  const sesionId = typeof query.sesion === "string" ? query.sesion : null;
  const [proyectos, sesiones, sesionInicial] = await Promise.all([
    listarProyectosLancelot(),
    listarSesionesLancelot(),
    sesionId ? obtenerSesionLancelot(sesionId) : Promise.resolve(null),
  ]);

  if (sesionId && !sesionInicial) notFound();
  return <LancelotLoop proyectos={proyectos} sesiones={sesiones} sesionInicial={sesionInicial} />;
}

