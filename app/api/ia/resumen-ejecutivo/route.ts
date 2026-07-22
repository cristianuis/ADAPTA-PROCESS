import Anthropic from "@anthropic-ai/sdk";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import type { Arquetipo } from "@/lib/supabase/types";
import { z } from "zod";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";

const MODELO = "claude-haiku-4-5-20251001";

const bodySchema = z.object({ proyectoId: z.string().uuid() });

const SYSTEM_PROMPT = `Eres un consultor senior en estructuración organizacional redactando el resumen
ejecutivo de un informe de diagnóstico para el cliente. Tono profesional, directo, sin relleno.
Máximo 3 párrafos. No inventes datos que no estén en el contexto proporcionado.
Responde solo con el texto del resumen, sin títulos ni markdown.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no está configurada en el servidor." }, { status: 500 });
  }

  const { consultor } = await requireConsultor();

  const limite = verificarLimite(`resumen-ejecutivo:${consultor.id}`, 10, 60_000);
  if (!limite.ok) {
    return Response.json(
      { error: `Demasiadas solicitudes. Intenta de nuevo en ${limite.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 422 });

  const supabase = await createClient();
  const { proyectoId } = parsed.data;

  const [{ data: proyecto }, { data: triage }, { data: hallazgos }] = await Promise.all([
    supabase.from("proyectos").select("*, clientes(razon_social, sector)").eq("id", proyectoId).maybeSingle(),
    supabase.from("triage_respuestas").select("*").eq("proyecto_id", proyectoId).maybeSingle(),
    supabase.from("hallazgos").select("titulo, categoria, impacto").eq("proyecto_id", proyectoId),
  ]);

  if (!proyecto) return Response.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const arquetipoInfo = triage ? ARQUETIPO_INFO[triage.arquetipo_sugerido as Arquetipo] : null;

  const contexto = `
Cliente: ${proyecto.clientes?.razon_social ?? "sin nombre"}
Sector: ${proyecto.clientes?.sector ?? "no especificado"}
Proyecto: ${proyecto.nombre}
${arquetipoInfo ? `Arquetipo de intervención: ${arquetipoInfo.titulo} — ${arquetipoInfo.descripcion}` : "Sin triage aplicado."}
Hallazgos principales identificados (${hallazgos?.length ?? 0}):
${(hallazgos ?? []).map((h) => `- ${h.titulo} (categoría: ${h.categoria}, impacto: ${h.impacto}/5)`).join("\n") || "Ninguno registrado todavía."}
`.trim();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contexto }],
    });
  } catch (e) {
    console.error("[resumen-ejecutivo] fallo llamando a Anthropic:", e);
    return Response.json({ error: "No se pudo generar el resumen con IA." }, { status: 502 });
  }

  await registrarLlamadaIA({
    consultorId: consultor.id,
    proyectoId,
    endpoint: "resumen-ejecutivo",
    modelo: MODELO,
    tokensEntrada: response.usage?.input_tokens ?? null,
    tokensSalida: response.usage?.output_tokens ?? null,
  });

  const texto = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return Response.json({ resumen: texto });
}
