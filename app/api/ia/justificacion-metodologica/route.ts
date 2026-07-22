import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import type { Arquetipo } from "@/lib/supabase/types";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";

const MODELO = "claude-haiku-4-5-20251001";
const bodySchema = z.object({ proyectoId: z.string().uuid() });

const SYSTEM_PROMPT = `Eres un consultor senior redactando la sección "justificación metodológica" de una
propuesta comercial de consultoría en procesos. Explica en 2 párrafos, en lenguaje de propuesta (no académico),
por qué la ruta de intervención propuesta es la adecuada dado el arquetipo diagnosticado.
Responde solo con el texto, sin títulos ni markdown.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no está configurada en el servidor." }, { status: 500 });
  }

  const { consultor } = await requireConsultor();

  const limite = verificarLimite(`justificacion-metodologica:${consultor.id}`, 10, 60_000);
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
  const { data: triage } = await supabase
    .from("triage_respuestas")
    .select("*")
    .eq("proyecto_id", parsed.data.proyectoId)
    .maybeSingle();

  if (!triage) {
    return Response.json({ error: "Este proyecto no tiene triage aplicado todavía." }, { status: 422 });
  }

  const info = ARQUETIPO_INFO[triage.arquetipo_sugerido as Arquetipo];
  const contexto = `Arquetipo diagnosticado: ${info.titulo}\nDescripción: ${info.descripcion}\nPuntaje de triage: ${triage.puntaje_total}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let response;
  try {
    response = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contexto }],
    });
  } catch (e) {
    console.error("[justificacion-metodologica] fallo llamando a Anthropic:", e);
    return Response.json({ error: "No se pudo generar el texto con IA." }, { status: 502 });
  }

  await registrarLlamadaIA({
    consultorId: consultor.id,
    proyectoId: parsed.data.proyectoId,
    endpoint: "justificacion-metodologica",
    modelo: MODELO,
    tokensEntrada: response.usage?.input_tokens ?? null,
    tokensSalida: response.usage?.output_tokens ?? null,
  });

  const texto = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return Response.json({ texto });
}
