import Anthropic from "@anthropic-ai/sdk";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { guardarTranscripcionSchema, analisisEntrevistaSchema } from "@/lib/validations/entrevista.schema";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";
import { ARQUETIPO_INFO } from "@/lib/triage/clasificar-arquetipo";
import { DIMENSION_LABEL, DIMENSIONES_PROCESO, DIMENSIONES_EMPRESA } from "@/lib/pemm/descriptores";
import type { Arquetipo } from "@/lib/supabase/types";

// Haiku por defecto: la extracción estructurada de hallazgos no requiere el razonamiento
// más caro de Sonnet. Si la calidad no alcanza en casos reales, subir a "claude-sonnet-5".
const MODELO = "claude-haiku-4-5-20251001";

// Exportado para poder probar en tests que el prompt exige la terminología técnica del
// marco ADAPTA/PEMM y no lenguaje genérico de IA (ver lib/validations/__tests__).
export const SYSTEM_PROMPT = `Eres un consultor senior de procesos aplicando el Modelo ADAPTA y el modelo de
madurez PEMM (Process and Enterprise Maturity Model, de Michael Hammer) para analizar transcripciones de
entrevistas de diagnóstico organizacional. No eres un asistente genérico resumiendo texto: eres quien redacta
el hallazgo técnico que un consultor senior firmaría con su nombre.

TERMINOLOGÍA OBLIGATORIA — usa el vocabulario técnico del marco, nunca su versión genérica:
- En vez de "procesos poco desarrollados" o "madurez baja": nombra el nivel PEMM exacto que sustenta la
  afirmación (ej. "nivel de madurez P1 según el modelo PEMM de Hammer") y cuál de los 5 habilitadores de
  proceso lo evidencia: diseño, ejecutores, responsable, infraestructura o indicadores.
- En vez de "problemas de comunicación" o "falta de coordinación": nombra el patrón real, por ejemplo
  "brecha entre la capacidad de dirección y la ejecución operativa" o "ausencia de punto de control
  formal entre [rol A] y [rol B]".
- En vez de "se recomienda mejorar la cultura": describe la señal concreta observada (ej. "cultura de
  silos: cada rol asume que el error se filtra en la siguiente etapa del proceso").
- Nunca uses relleno genérico tipo "se recomienda fortalecer la comunicación interna" sin anclar la
  afirmación a una cita textual, un dato del proyecto o una respuesta de triage.

ANCLAJE OBLIGATORIO A DATOS REALES:
- Todo hallazgo debe estar sustentado por "cita_soporte": una cita textual corta de la transcripción,
  nunca un resumen ni una paráfrasis.
- Prohibido generar un hallazgo que no esté soportado literalmente en el texto de la entrevista.
- Si el contexto del proyecto incluye arquetipo de triage o niveles PEMM ya evaluados, úsalos para dar
  sustento adicional al hallazgo (ej. "consistente con el nivel P1 en Diseño ya registrado en el
  diagnóstico PEMM de este proyecto"), pero nunca inventes un nivel que no te haya sido dado como contexto.

Responde ÚNICAMENTE con JSON válido, sin preámbulo ni markdown, con esta estructura exacta:
{
  "hallazgos": [
    {
      "titulo": string,
      "descripcion": string,
      "categoria": "proceso"|"gobierno"|"tecnologia"|"cultura"|"datos",
      "impacto_estimado": 1-5,
      "cita_soporte": string,
      "confianza": "alta"|"media"|"baja",
      "habilitador_pemm": "diseno"|"ejecutores"|"responsable"|"infraestructura"|"indicadores"|null
    }
  ],
  "procesos_mencionados": string[],
  "nivel_resistencia": "bajo"|"medio"|"alto",
  "senales_gobierno": string[]
}
Reglas:
- No inventes hallazgos que no estén soportados en el texto.
- Marca confianza "baja" cuando el hallazgo sea inferencia y no afirmación directa.
- "habilitador_pemm" es obligatorio cuando categoria="proceso" y el hallazgo corresponde claramente a uno
  de los 5 habilitadores (diseño, ejecutores, responsable, infraestructura, indicadores); usa null solo si
  categoria≠"proceso" o el hallazgo no calza en ningún habilitador específico.
- En "señales_gobierno" reporta cualquier indicio de decisión difusa o conflicto de autoridad, usando el
  lenguaje de "concentración de decisión" o "conflicto de autoridad formal vs. real", no "malos jefes".
- "cita_soporte" debe ser una cita textual corta de la transcripción, no un resumen.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY no está configurada en el servidor." },
      { status: 500 }
    );
  }

  const { consultor } = await requireConsultor();

  const limite = verificarLimite(`analizar-entrevista:${consultor.id}`, 10, 60_000);
  if (!limite.ok) {
    return Response.json(
      { error: `Demasiadas solicitudes. Intenta de nuevo en ${limite.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = guardarTranscripcionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 422 });
  }

  const { entrevistaId, transcripcion, confirmarSobrescritura } = parsed.data;

  const supabase = await createClient();
  const { data: entrevista } = await supabase
    .from("entrevistas")
    .select("proyecto_id, entrevistado_cargo, nivel, hallazgos_validados")
    .eq("id", entrevistaId)
    .maybeSingle();

  if (!entrevista) {
    return Response.json({ error: "Entrevista no encontrada." }, { status: 404 });
  }

  const tieneValidados = (entrevista.hallazgos_validados?.length ?? 0) > 0;
  if (tieneValidados && !confirmarSobrescritura) {
    return Response.json(
      {
        error:
          "Esta entrevista ya tiene hallazgos validados. Volver a analizar puede desalinear cuáles ya fueron aprobados.",
        requiereConfirmacion: true,
      },
      { status: 409 }
    );
  }

  const [{ data: triage }, { data: evaluacionesPemm }] = await Promise.all([
    supabase
      .from("triage_respuestas")
      .select("arquetipo_sugerido, puntaje_total")
      .eq("proyecto_id", entrevista.proyecto_id)
      .maybeSingle(),
    supabase
      .from("pemm_evaluaciones")
      .select("tipo, proceso_evaluado, nivel_resultante, diseno, ejecutores, responsable, infraestructura, indicadores, liderazgo, cultura, experiencia, gobierno")
      .eq("proyecto_id", entrevista.proyecto_id)
      .eq("estado", "respondida"),
  ]);

  const lineasPemm = (evaluacionesPemm ?? []).map((ev) => {
    const dims = ev.tipo === "proceso" ? DIMENSIONES_PROCESO : DIMENSIONES_EMPRESA;
    const detalle = dims.map((d) => `${DIMENSION_LABEL[d]}=${ev[d] ?? "—"}`).join(", ");
    const nombre = ev.tipo === "proceso" ? `proceso "${ev.proceso_evaluado ?? "sin nombre"}"` : "empresa";
    return `- PEMM ${nombre}: nivel resultante ${ev.nivel_resultante ?? "—"} (${detalle})`;
  });

  const contextoProyecto = `Cargo del entrevistado: ${entrevista.entrevistado_cargo ?? "no especificado"}. Nivel jerárquico: ${entrevista.nivel ?? "no especificado"}.
${triage ? `Arquetipo de triage: ${ARQUETIPO_INFO[triage.arquetipo_sugerido as Arquetipo].titulo} (puntaje ${triage.puntaje_total}).` : "Sin triage aplicado todavía."}
${lineasPemm.length > 0 ? `Evaluaciones PEMM ya registradas:\n${lineasPemm.join("\n")}` : "Sin evaluaciones PEMM registradas todavía."}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODELO,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `CONTEXTO DEL PROYECTO:\n${contextoProyecto}\n\nTRANSCRIPCIÓN:\n${transcripcion}`,
        },
      ],
    });
  } catch (e) {
    console.error("[analizar-entrevista] fallo llamando a Anthropic:", e);
    return Response.json({ error: "No se pudo completar el análisis con IA. Intenta de nuevo." }, { status: 502 });
  }

  await registrarLlamadaIA({
    consultorId: consultor.id,
    proyectoId: entrevista.proyecto_id,
    endpoint: "analizar-entrevista",
    modelo: MODELO,
    tokensEntrada: response.usage?.input_tokens ?? null,
    tokensSalida: response.usage?.output_tokens ?? null,
  });

  const texto = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const limpio = texto.replace(/```json|```/g, "").trim();

  let json: unknown;
  try {
    json = JSON.parse(limpio);
  } catch (e) {
    console.error("[analizar-entrevista] respuesta no parseable:", e, limpio);
    return Response.json({ error: "La IA devolvió una respuesta no parseable.", raw: limpio }, { status: 422 });
  }

  const analisis = analisisEntrevistaSchema.safeParse(json);
  if (!analisis.success) {
    return Response.json(
      { error: "La respuesta de la IA no tuvo el formato esperado.", raw: json },
      { status: 422 }
    );
  }

  const { error: updateError } = await supabase
    .from("entrevistas")
    .update({
      transcripcion,
      hallazgos_ia: analisis.data.hallazgos,
      nivel_resistencia: analisis.data.nivel_resistencia,
      senales_gobierno: analisis.data.senales_gobierno,
    })
    .eq("id", entrevistaId);

  if (updateError) {
    return Response.json({ error: "El análisis se generó pero no se pudo guardar." }, { status: 500 });
  }

  return Response.json({ analisis: analisis.data, procesos_mencionados: analisis.data.procesos_mencionados });
}
