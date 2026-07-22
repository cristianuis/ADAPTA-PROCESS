import { Packer } from "docx";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { generarPropuestaComercial } from "@/lib/documentos/generar-propuesta-comercial";

const bodySchema = z.object({
  proyectoId: z.string().uuid(),
  alcance: z.string().trim().min(1),
  exclusiones: z.string().trim().min(1),
  justificacionMetodologica: z.string().trim().min(1),
  inversionMinima: z.number().nonnegative(),
  inversionMaxima: z.number().nonnegative(),
});

export async function POST(req: Request) {
  const { consultor } = await requireConsultor();

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 422 });
  }

  const { proyectoId, ...resto } = parsed.data;
  const supabase = await createClient();

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("*, clientes(*)")
    .eq("id", proyectoId)
    .maybeSingle();

  if (!proyecto || !proyecto.clientes) {
    return Response.json({ error: "Proyecto no encontrado." }, { status: 404 });
  }

  const { data: triage } = await supabase
    .from("triage_respuestas")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .maybeSingle();

  const documento = generarPropuestaComercial({
    consultor,
    cliente: proyecto.clientes,
    proyecto,
    triage: triage ?? null,
    ...resto,
  });

  const buffer = await Packer.toBuffer(documento);

  await supabase.from("entregables").insert({
    proyecto_id: proyectoId,
    tipo: "propuesta",
    nombre: `Propuesta Comercial — ${proyecto.nombre}`,
    fase: "prospecto",
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Propuesta Comercial - ${proyecto.clientes.razon_social}.docx"`,
    },
  });
}
