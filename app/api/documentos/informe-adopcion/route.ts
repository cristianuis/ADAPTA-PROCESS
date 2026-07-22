import { Packer } from "docx";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { generarInformeAdopcion } from "@/lib/documentos/generar-informe-adopcion";

const bodySchema = z.object({ auditoriaId: z.string().uuid() });

export async function POST(req: Request) {
  const { consultor } = await requireConsultor();

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 422 });

  const supabase = await createClient();
  const { data: auditoria } = await supabase
    .from("auditorias_adopcion")
    .select("*, procesos(nombre)")
    .eq("id", parsed.data.auditoriaId)
    .maybeSingle();

  if (!auditoria) return Response.json({ error: "Auditoría no encontrada." }, { status: 404 });

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("*, clientes(*)")
    .eq("id", auditoria.proyecto_id)
    .maybeSingle();

  if (!proyecto || !proyecto.clientes) return Response.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const documento = generarInformeAdopcion({
    consultor,
    cliente: proyecto.clientes,
    proyecto,
    proceso: { nombre: auditoria.procesos?.nombre ?? "Proceso" },
    auditoria,
  });

  const buffer = await Packer.toBuffer(documento);

  await supabase.from("entregables").insert({
    proyecto_id: auditoria.proyecto_id,
    tipo: "auditoria",
    nombre: `Informe de Adopción — ${auditoria.procesos?.nombre ?? "Proceso"}`,
    fase: "anclaje",
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Informe de Adopcion.docx"`,
    },
  });
}
