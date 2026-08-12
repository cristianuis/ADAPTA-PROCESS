import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare, ListChecks, GitBranch, LayoutDashboard, TrendingUp, FileText, ClipboardList, Rocket } from "lucide-react";
import { obtenerProyecto } from "@/lib/actions/proyectos";
import { obtenerTriage } from "@/lib/actions/triage";
import { listarEntregables } from "@/lib/actions/entregables";
import { listarEvaluacionesPemm } from "@/lib/actions/pemm";
import { listarEntrevistas, listarEntrevistadosRegistrados } from "@/lib/actions/entrevistas";
import { listarHallazgos } from "@/lib/actions/hallazgos";
import { listarProcesos } from "@/lib/actions/procesos";
import { obtenerSipoc } from "@/lib/actions/sipoc";
import { listarActividades } from "@/lib/actions/actividades";
import { listarIndicadores } from "@/lib/actions/indicadores";
import { listarAuditorias } from "@/lib/actions/auditorias";
import { obtenerPlanMejora } from "@/lib/actions/mejoras";
import { GenerarEnlaceAutoservicioForm } from "@/components/entrevistas/GenerarEnlaceAutoservicioForm";
import { RecorridoGuiado, type DatosRecorrido } from "@/components/proyectos/RecorridoGuiado";
import { FaseBadge } from "@/components/proyectos/FaseBadge";
import { EstadoComercialBadge } from "@/components/proyectos/EstadoComercialBadge";
import { TYPE_SCALE, SPACING_SCALE } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "pemm", label: "Diagnóstico PEMM", icon: ClipboardList },
  { href: "entrevistas", label: "Entrevistas", icon: MessageSquare },
  { href: "hallazgos", label: "Hallazgos", icon: ListChecks },
  { href: "mejoras", label: "Impacto y mejoras", icon: Rocket },
  { href: "procesos", label: "Procesos", icon: GitBranch },
  { href: "tablero", label: "Tablero", icon: LayoutDashboard },
  { href: "adopcion", label: "Adopción", icon: TrendingUp },
  { href: "entregables", label: "Entregables", icon: FileText },
];

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ proyectoId: string }>;
}) {
  const { proyectoId } = await params;
  const proyecto = await obtenerProyecto(proyectoId);
  if (!proyecto) notFound();

  const [triage, entregables, evaluacionesPemm, entrevistas, hallazgos, procesos, auditorias, personasRegistradas, planMejora] =
    await Promise.all([
      obtenerTriage(proyectoId),
      listarEntregables(proyectoId),
      listarEvaluacionesPemm(proyectoId),
      listarEntrevistas(proyectoId),
      listarHallazgos(proyectoId),
      listarProcesos(proyectoId),
      listarAuditorias(proyectoId),
      listarEntrevistadosRegistrados(proyectoId),
      obtenerPlanMejora(proyectoId),
    ]);

  // Procesos "críticos" (paso 9 del recorrido): los que ya tienen dueño asignado. El
  // paso 10 (SIPOC + actividades + indicadores) se evalúa solo sobre estos.
  const procesosCriticos = procesos.filter((p) => p.dueno_nombre);
  const detallesProcesosCriticos = await Promise.all(
    procesosCriticos.map(async (p) => {
      const [sipoc, actividades, indicadores] = await Promise.all([
        obtenerSipoc(p.id),
        listarActividades(p.id),
        listarIndicadores(p.id),
      ]);
      return { sipoc, actividades, indicadores };
    })
  );

  const datosRecorrido: DatosRecorrido = {
    clienteId: proyecto.clientes?.id ?? "",
    clienteCompleto: !!proyecto.clientes?.razon_social,
    triageCompleto: !!triage,
    pemmEmpresaCompleto: evaluacionesPemm.some((e) => e.tipo === "empresa" && e.estado === "respondida"),
    pemmProcesoCompleto: evaluacionesPemm.some((e) => e.tipo === "proceso" && e.estado === "respondida"),
    entrevistasCompleto: entrevistas.some((e) => e.hallazgos_ia != null),
    hallazgosValidadosCompleto: hallazgos.length > 0,
    planMejoraCompleto:
      planMejora.cuantificaciones.length > 0 &&
      planMejora.iniciativas.length > 0 &&
      planMejora.acciones.length > 0,
    informeDiagnosticoCompleto: entregables.some((e) => e.tipo === "diagnostico"),
    procesosConDuenoCompleto: procesosCriticos.length > 0,
    sipocActividadIndicadorCompleto: detallesProcesosCriticos.some(
      (d) =>
        !!d.sipoc &&
        d.actividades.length > 0 &&
        d.indicadores.some((i) => !!i.fuente_datos && i.fuente_datos.trim().length > 0)
    ),
    manualProcesosCompleto: entregables.some((e) => e.tipo === "manual"),
    auditoriaAdopcionCompleto: auditorias.length > 0,
  };

  return (
    <div className={cn("flex flex-col", SPACING_SCALE.xl)}>
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={TYPE_SCALE.h1}>{proyecto.nombre}</h1>
          <p className={TYPE_SCALE.meta}>
            Cliente:{" "}
            <Link href={`/clientes/${proyecto.clientes?.id}`} className="hover:underline">
              {proyecto.clientes?.razon_social}
            </Link>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <EstadoComercialBadge estado={proyecto.estado_comercial} />
            <FaseBadge fase={proyecto.fase_metodologica} />
          </div>
        </div>
        <GenerarEnlaceAutoservicioForm proyectoId={proyecto.id} personasRegistradas={personasRegistradas} />
      </div>

      <RecorridoGuiado proyectoId={proyecto.id} datos={datosRecorrido} />

      <div className="flex flex-col gap-2">
        <h2 className={TYPE_SCALE.meta}>Acceso directo</h2>
        <nav className="flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={`/proyectos/${proyecto.id}/${item.href}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
                TYPE_SCALE.meta
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
