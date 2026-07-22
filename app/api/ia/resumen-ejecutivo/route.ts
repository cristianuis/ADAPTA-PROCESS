import Anthropic from "@anthropic-ai/sdk";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import { DIMENSION_LABEL, DIMENSIONES_PROCESO, DIMENSIONES_EMPRESA } from "@/lib/pemm/descriptores";
import { construirBloqueEstiloConsultor } from "@/lib/ia/estilo-consultor";
import type { Arquetipo } from "@/lib/supabase/types";
import { z } from "zod";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";

const MODELO = "claude-haiku-4-5-20251001";

const bodySchema = z.object({ proyectoId: z.string().uuid() });

export const SYSTEM_PROMPT = `Eres un consultor senior en gestión de procesos redactando el resumen
ejecutivo de un Informe de Diagnóstico, aplicando el Modelo ADAPTA y el modelo de madurez PEMM
(Process and Enterprise Maturity Model, de Michael Hammer). Este texto lo lee el gerente general del
cliente: debe leerse como el diagnóstico de un consultor senior, no como un resumen genérico de IA.

TERMINOLOGÍA OBLIGATORIA:
- Si hay un nivel PEMM en el contexto, cítalo por su nombre exacto (ej. "nivel de madurez P1 según el
  modelo PEMM de Hammer") y menciona el habilitador que lo sustenta (diseño, ejecutores, responsable,
  infraestructura o indicadores) — nunca digas solo "madurez baja" sin ese anclaje.
- Si hay alerta de gobierno, nómbrala como "señal de gobierno societario" o "concentración de decisión",
  no como "problema de comunicación" o "falta de liderazgo".
- Cada afirmación debe anclarse a un dato concreto del contexto entregado: el arquetipo y puntaje de
  triage, un nivel PEMM específico, o un hallazgo con su categoría e impacto. Prohibido escribir una
  frase que no pueda señalarse a un dato de este proyecto en particular.

Tono profesional, directo, sin relleno. Máximo 3 párrafos. No inventes datos que no estén en el contexto
proporcionado. Responde solo con el texto del resumen, sin títulos ni markdown.`;

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

  const [{ data: proyecto }, { data: triage }, { data: hallazgos }, { data: evaluacionesPemm }] = await Promise.all([
    supabase.from("proyectos").select("*, clientes(razon_social, sector)").eq("id", proyectoId).maybeSingle(),
    supabase.from("triage_respuestas").select("*").eq("proyecto_id", proyectoId).maybeSingle(),
    supabase.from("hallazgos").select("titulo, categoria, impacto").eq("proyecto_id", proyectoId),
    supabase
      .from("pemm_evaluaciones")
      .select(
        "tipo, proceso_evaluado, nivel_resultante, diseno, ejecutores, responsable, infraestructura, indicadores, liderazgo, cultura, experiencia, gobierno"
      )
      .eq("proyecto_id", proyectoId)
      .eq("estado", "respondida"),
  ]);

  if (!proyecto) return Response.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const arquetipoInfo = triage ? ARQUETIPO_INFO[triage.arquetipo_sugerido as Arquetipo] : null;

  const lineasPemm = (evaluacionesPemm ?? []).map((ev) => {
    const habilitadorMinimo = (ev.tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA)
      .filter((d) => ev[d] === ev.nivel_resultante)
      .map((d) => DIMENSION_LABEL[d]);
    const nombre = ev.tipo === "proceso" ? `proceso "${ev.proceso_evaluado ?? "sin nombre"}"` : "empresa";
    return `- PEMM ${nombre}: nivel resultante ${ev.nivel_resultante ?? "—"} (habilitador(es) en ese nivel mínimo: ${habilitadorMinimo.join(", ") || "—"})`;
  });

  const contexto = `
Cliente: ${proyecto.clientes?.razon_social ?? "sin nombre"}
Sector: ${proyecto.clientes?.sector ?? "no especificado"}
Proyecto: ${proyecto.nombre}
${arquetipoInfo ? `Arquetipo de intervención: ${arquetipoInfo.titulo} (puntaje ${triage?.puntaje_total}) — ${arquetipoInfo.descripcion}` : "Sin triage aplicado."}
${triage?.alerta_gobierno ? "Alerta de gobierno societario activa (respuesta de triage P6 = estructura de decisión difusa)." : ""}
Evaluaciones PEMM (Hammer) registradas (${evaluacionesPemm?.length ?? 0}):
${lineasPemm.join("\n") || "Ninguna registrada todavía."}
Hallazgos principales identificados (${hallazgos?.length ?? 0}):
${(hallazgos ?? []).map((h) => `- ${h.titulo} (categoría: ${h.categoria}, impacto: ${h.impacto}/5)`).join("\n") || "Ninguno registrado todavía."}
`.trim();

  // Bloque 1.3 — inactivo por defecto: solo se agrega si el consultor configuró su propia
  // referencia de voz en /perfil. Sin eso, el prompt es idéntico al de antes de este cambio.
  const bloqueEstilo = construirBloqueEstiloConsultor(consultor.ejemplos_estilo);
  const systemPrompt = bloqueEstilo ? `${SYSTEM_PROMPT}\n\n${bloqueEstilo}` : SYSTEM_PROMPT;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 1000,
      system: systemPrompt,
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
