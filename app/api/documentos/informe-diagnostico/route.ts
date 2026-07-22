import { Packer } from "docx";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { generarInformeDiagnostico } from "@/lib/documentos/generar-informe-diagnostico";

const bodySchema = z.object({
  proyectoId: z.string().uuid(),
  resumenEjecutivo: z.string().trim().min(1, "El resumen ejecutivo no puede estar vacío"),
});

export async function POST(req: Request) {
  const { consultor } = await requireConsultor();

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 422 });
  }

  const { proyectoId, resumenEjecutivo } = parsed.data;
  const supabase = await createClient();

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("*, clientes(*)")
    .eq("id", proyectoId)
    .maybeSingle();

  if (!proyecto || !proyecto.clientes) {
    return Response.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }

  const [{ data: triage }, { data: evaluacionesPemm }, { data: hallazgos }] = await Promise.all([
    supabase.from("triage_respuestas").select("*").eq("proyecto_id", proyectoId).maybeSingle(),
    supabase.from("pemm_evaluaciones").select("*").eq("proyecto_id", proyectoId),
    supabase.from("hallazgos").select("*").eq("proyecto_id", proyectoId).order("impacto", { ascending: false }),
  ]);

  const documento = generarInformeDiagnostico({
    consultor,
    cliente: proyecto.clientes,
    proyecto,
    triage: triage ?? null,
    evaluacionesPemm: evaluacionesPemm ?? [],
    hallazgos: hallazgos ?? [],
    resumenEjecutivo,
  });

  const buffer = await Packer.toBuffer(documento);

  await supabase.from("entregables").insert({
    proyecto_id: proyectoId,
    tipo: "diagnostico",
    nombre: `Informe de Diagnóstico — ${proyecto.nombre}`,
    fase: "diagnostico",
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Informe de Diagnostico - ${proyecto.clientes.razon_social}.docx"`,
    },
  });
}
