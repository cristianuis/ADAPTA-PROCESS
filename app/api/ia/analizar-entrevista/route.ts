import Anthropic from "@anthropic-ai/sdk";
import { requireConsultor } from "@/lib/actions/consultores";
import { createClient } from "@/lib/supabase/server";
import { guardarTranscripcionSchema, analisisEntrevistaSchema } from "@/lib/validations/entrevista.schema";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";

// Haiku por defecto: la extracción estructurada de hallazgos no requiere el razonamiento
// más caro de Sonnet. Si la calidad no alcanza en casos reales, subir a "claude-sonnet-5".
const MODELO = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Eres un analista de diagnóstico organizacional aplicando el Modelo ADAPTA.
Analizas transcripciones de entrevistas para extraer hallazgos estructurados.
Responde ÚNICAMENTE con JSON válido, sin preámbulo ni markdown, con esta estructura exacta:
{
  "hallazgos": [
    {
      "titulo": string,
      "descripcion": string,
      "categoria": "proceso"|"gobierno"|"tecnologia"|"cultura"|"datos",
      "impacto_estimado": 1-5,
      "cita_soporte": string,
      "confianza": "alta"|"media"|"baja"
    }
  ],
  "procesos_mencionados": string[],
  "nivel_resistencia": "bajo"|"medio"|"alto",
  "senales_gobierno": string[]
}
Reglas:
- No inventes hallazgos que no estén soportados en el texto.
- Marca confianza "baja" cuando el hallazgo sea inferencia y no afirmación directa.
- En "señales_gobierno" reporta cualquier indicio de decisión difusa o conflicto de autoridad.
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

  const contextoProyecto = `Cargo del entrevistado: ${entrevista.entrevistado_cargo ?? "no especificado"}. Nivel jerárquico: ${entrevista.nivel ?? "no especificado"}.`;

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
