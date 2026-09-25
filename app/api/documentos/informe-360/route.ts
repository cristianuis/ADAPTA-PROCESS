import { Packer } from "docx";
import { z } from "zod";
import { cargarDatosInforme360 } from "@/lib/documentos/datos-informe-360";
import { generarInforme360 } from "@/lib/documentos/generar-informe-360";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";

const bodySchema = z.object({
  proyectoId: z.string().uuid(),
  sintesisConsultor: z.string().trim().min(30, "Escribe una síntesis revisada de al menos 30 caracteres"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 422 });

  const datos = await cargarDatosInforme360(parsed.data.proyectoId);
  if (!datos) return Response.json({ error: "Intervención no encontrada o sin acceso." }, { status: 404 });
  if (!datos.preparacion.listo) {
    return Response.json({ error: "El Informe 360 aún tiene secciones obligatorias sin completar.", faltantes: datos.preparacion.faltantes }, { status: 409 });
  }

  const documento = generarInforme360(datos, parsed.data.sintesisConsultor);
  const buffer = await Packer.toBuffer(documento);
  const supabase = await createClient();
  const entregableId = crypto.randomUUID();
  const archivoPath = `${datos.consultor.id}/${datos.proyecto.id}/${entregableId}.docx`;
  const { error: archivoError } = await supabase.storage.from("nexus-informes")
    .upload(archivoPath, new Uint8Array(buffer), {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false,
    });
  if (archivoError) return Response.json({ error: "No se pudo guardar el archivo privado del informe." }, { status: 500 });

  const { error } = await supabase.from("entregables").insert({
    id: entregableId,
    proyecto_id: parsed.data.proyectoId,
    tipo: "informe_360",
    nombre: `Informe 360 — ${datos.proyecto.nombre}`,
    fase: "cierre",
    estado: "revision",
    archivo_path: archivoPath,
  });
  if (error) {
    await supabase.storage.from("nexus-informes").remove([archivoPath]);
    return Response.json({ error: "No se pudo registrar el informe. No se generó una entrega." }, { status: 500 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="Informe-360-NEXUS.docx"',
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  await requireConsultor();
  const id = z.string().uuid().safeParse(new URL(req.url).searchParams.get("entregableId"));
  if (!id.success) return Response.json({ error: "Informe inválido." }, { status: 422 });
  const supabase = await createClient();
  const { data: entregable, error } = await supabase.from("entregables")
    .select("archivo_path, tipo").eq("id", id.data).maybeSingle();
  if (error || !entregable || entregable.tipo !== "informe_360" || !entregable.archivo_path) {
    return Response.json({ error: "Informe no encontrado o sin archivo recuperable." }, { status: 404 });
  }
  const { data, error: descargaError } = await supabase.storage.from("nexus-informes")
    .download(entregable.archivo_path);
  if (descargaError || !data) return Response.json({ error: "No se pudo recuperar el archivo privado." }, { status: 500 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="Informe-360-NEXUS.docx"',
      "Cache-Control": "private, no-store",
    },
  });
}
