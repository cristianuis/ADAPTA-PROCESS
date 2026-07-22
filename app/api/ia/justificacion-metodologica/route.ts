import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import { construirBloqueEstiloConsultor } from "@/lib/ia/estilo-consultor";
import type { Arquetipo } from "@/lib/supabase/types";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";

const MODELO = "claude-haiku-4-5-20251001";
const bodySchema = z.object({ proyectoId: z.string().uuid() });

export const SYSTEM_PROMPT = `Eres un consultor senior redactando la sección "justificación metodológica" de una
propuesta comercial de consultoría en procesos, aplicando el Modelo ADAPTA. Explica en 2 párrafos, en lenguaje
de propuesta (no académico ni genérico), por qué la ruta de intervención propuesta es la adecuada dado el
arquetipo diagnosticado.

TERMINOLOGÍA OBLIGATORIA:
- Nombra el arquetipo por su título técnico exacto (ej. "Arquetipo B — Crecimiento") y conecta la
  justificación directamente con el puntaje de triage y la respuesta que más pesó en esa clasificación.
- Prohibido usar frases genéricas de propuesta comercial ("le ayudaremos a mejorar sus procesos", "juntos
  construiremos una organización más eficiente") que no citen el dato específico de este cliente.
- Cada párrafo debe anclarse al arquetipo, puntaje o alerta de gobierno recibidos en el contexto — nunca a
  una afirmación que serviría igual para cualquier otro cliente.

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
  const contexto = `Arquetipo diagnosticado: ${info.titulo}
Descripción: ${info.descripcion}
Puntaje de triage: ${triage.puntaje_total}
Disparador declarado por el cliente: ${triage.p5_disparador}
${triage.alerta_gobierno ? "Alerta de gobierno societario activa (estructura de decisión difusa detectada en triage)." : "Sin alerta de gobierno."}`;

  // Bloque 1.3 — inactivo por defecto: solo se agrega si el consultor configuró su propia
  // referencia de voz en /perfil. Sin eso, el prompt es idéntico al de antes de este cambio.
  const bloqueEstilo = construirBloqueEstiloConsultor(consultor.ejemplos_estilo);
  const systemPrompt = bloqueEstilo ? `${SYSTEM_PROMPT}\n\n${bloqueEstilo}` : SYSTEM_PROMPT;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let response;
  try {
    response = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 800,
      system: systemPrompt,
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
