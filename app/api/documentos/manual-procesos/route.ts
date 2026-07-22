import { Packer } from "docx";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { generarManualProcesos, type ProcesoCompleto } from "@/lib/documentos/generar-manual-procesos";

const bodySchema = z.object({ proyectoId: z.string().uuid() });

export async function POST(req: Request) {
  const { consultor } = await requireConsultor();

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 422 });

  const { proyectoId } = parsed.data;
  const supabase = await createClient();

  const { data: proyecto } = await supabase.from("proyectos").select("*, clientes(*)").eq("id", proyectoId).maybeSingle();
  if (!proyecto || !proyecto.clientes) return Response.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const { data: procesosRaw } = await supabase
    .from("procesos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("prioridad", { ascending: true, nullsFirst: false });

  if (!procesosRaw || procesosRaw.length === 0) {
    return Response.json({ error: "Este proyecto todavía no tiene procesos diseñados." }, { status: 422 });
  }

  const procesos: ProcesoCompleto[] = await Promise.all(
    procesosRaw.map(async (proceso) => {
      const [{ data: sipoc }, { data: actividades }, { data: indicadores }] = await Promise.all([
        supabase.from("sipoc").select("*").eq("proceso_id", proceso.id).maybeSingle(),
        supabase.from("actividades").select("*").eq("proceso_id", proceso.id).order("orden"),
        supabase.from("indicadores").select("*").eq("proceso_id", proceso.id),
      ]);
      return { proceso, sipoc: sipoc ?? null, actividades: actividades ?? [], indicadores: indicadores ?? [] };
    })
  );

  const documento = generarManualProcesos({ consultor, cliente: proyecto.clientes, proyecto, procesos });
  const buffer = await Packer.toBuffer(documento);

  await supabase.from("entregables").insert({
    proyecto_id: proyectoId,
    tipo: "manual",
    nombre: `Manual de Procesos — ${proyecto.nombre}`,
    fase: "arquitectura",
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Manual de Procesos - ${proyecto.clientes.razon_social}.docx"`,
    },
  });
}
