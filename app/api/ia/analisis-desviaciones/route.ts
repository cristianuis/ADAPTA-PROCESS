import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireConsultor } from "@/lib/actions/consultores";
import { verificarLimite } from "@/lib/rate-limit";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";

const MODELO = "claude-haiku-4-5-20251001";

const bodySchema = z.object({
  proyectoId: z.string().uuid(),
  porcentajeAdopcion: z.number(),
  casosRevisados: z.number(),
  casosConformes: z.number(),
  desviaciones: z.array(z.string()),
});

export const SYSTEM_PROMPT = `Eres un consultor senior en gestión de procesos, aplicando el Modelo ADAPTA, analizando
resultados de una auditoría de adopción. A partir del porcentaje de adopción y las desviaciones observadas,
propone hipótesis de causa raíz.

TERMINOLOGÍA OBLIGATORIA:
- Cita el porcentaje de adopción exacto y el número de casos revisados/conformes recibidos en el contexto;
  nunca generalices con "la adopción es baja" sin el dato.
- Cada desviación listada en el contexto debe recibir una hipótesis de causa propia, referenciándola
  textualmente — prohibido agrupar todas las desviaciones bajo una única causa genérica como "falta de
  comunicación" o "resistencia al cambio" sin especificar el mecanismo concreto (ej. "ausencia de punto de
  control", "brecha entre diseño documentado y ejecución real").
- No inventes causas que no se puedan inferir razonablemente de los datos entregados.

Responde solo con el texto (2-3 párrafos o una lista corta), sin markdown ni títulos.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no está configurada en el servidor." }, { status: 500 });
  }

  const { consultor } = await requireConsultor();

  const limite = verificarLimite(`analisis-desviaciones:${consultor.id}`, 10, 60_000);
  if (!limite.ok) {
    return Response.json(
      { error: `Demasiadas solicitudes. Intenta de nuevo en ${limite.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 422 });

  const { proyectoId, porcentajeAdopcion, casosRevisados, casosConformes, desviaciones } = parsed.data;

  const contexto = `Porcentaje de adopción: ${porcentajeAdopcion}% (${casosConformes} de ${casosRevisados} casos conformes).
Desviaciones observadas:
${desviaciones.map((d) => `- ${d}`).join("\n") || "Ninguna registrada explícitamente."}`;

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
    console.error("[analisis-desviaciones] fallo llamando a Anthropic:", e);
    return Response.json({ error: "No se pudo generar el análisis con IA." }, { status: 502 });
  }

  await registrarLlamadaIA({
    consultorId: consultor.id,
    proyectoId,
    endpoint: "analisis-desviaciones",
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
