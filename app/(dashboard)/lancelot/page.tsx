import { notFound } from "next/navigation";
import { LancelotGuide } from "@/components/lancelot/LancelotGuide";
import {
  listarSesionesLancelot,
  obtenerSesionLancelot,
} from "@/lib/actions/lancelot";
import { obtenerGuiaLancelot } from "@/lib/actions/lancelot-guide";

export default async function LancelotPage({
  searchParams,
}: {
  searchParams: Promise<{ sesion?: string | string[]; proyecto?: string | string[] }>;
}) {
  const query = await searchParams;
  const sesionId = typeof query.sesion === "string" ? query.sesion : null;
  const proyectoId = typeof query.proyecto === "string" ? query.proyecto : null;
  const [guia, sesiones, sesionInicial] = await Promise.all([
    obtenerGuiaLancelot(proyectoId),
    listarSesionesLancelot(),
    sesionId ? obtenerSesionLancelot(sesionId) : Promise.resolve(null),
  ]);

  if (sesionId && !sesionInicial) notFound();

  const claveGuia = sesionInicial?.id ?? guia.accion.proyectoId ?? "inicio";
  return <LancelotGuide key={claveGuia} guiaInicial={guia} sesiones={sesiones} sesionInicial={sesionInicial} />;
}
