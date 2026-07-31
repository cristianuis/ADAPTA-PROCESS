import Anthropic from "@anthropic-ai/sdk";
import { requireConsultor } from "@/lib/actions/consultores";
import { registrarLlamadaIA } from "@/lib/actions/llamadas-ia";
import { createClient } from "@/lib/supabase/server";
import { verificarLimite } from "@/lib/rate-limit";
import {
  construirPromptLancelot,
  LANCELOT_SYSTEM_PROMPT,
  parsearRespuestaLancelot,
} from "@/lib/lancelot/prompt";
import { lancelotRequestSchema, respuestaLancelotSchema } from "@/lib/lancelot/types";

const MODELO = "claude-haiku-4-5-20251001";
const MAX_TOKENS_SALIDA = 900;

async function contarProyecto(proyectoId: string) {
  const supabase = await createClient();
  const consultas = await Promise.all([
    supabase.from("triage_respuestas").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
    supabase.from("pemm_evaluaciones").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId).eq("estado", "respondida"),
    supabase.from("entrevistas").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
    supabase.from("hallazgos").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
    supabase.from("procesos").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
    supabase.from("entregables").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
    supabase.from("auditorias_adopcion").select("id", { count: "exact", head: true }).eq("proyecto_id", proyectoId),
  ]);
  const etiquetas = ["triage", "PEMM", "entrevistas", "hallazgos", "procesos", "entregables", "auditorías"];
  return etiquetas.map((etiqueta, index) => `${etiqueta}: ${consultas[index].count ?? 0}`).join(", ");
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no está configurada en el servidor." }, { status: 500 });
  }

  const { consultor } = await requireConsultor();
  const limite = verificarLimite(`lancelot-loop:${consultor.id}`, 8, 60_000);
  if (!limite.ok) {
    return Response.json({ error: `Lancelot necesita una pausa. Intenta en ${limite.retryAfterSeconds}s.` }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 });
  }
  const parsed = lancelotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 422 });
  }

  const supabase = await createClient();
  let objetivo = parsed.data.objetivo ?? "";
  let foco = parsed.data.foco ?? "sistema";
  let horizonte = parsed.data.horizonte ?? "semana";
  let proyectoId = parsed.data.proyectoId ?? null;
  let sesionId = parsed.data.sesionId ?? null;
  let numero = 1;
  let historial = "";

  if (sesionId) {
    const { data: sesion } = await supabase
      .from("lancelot_sesiones")
      .select("*")
      .eq("id", sesionId)
      .eq("consultor_id", consultor.id)
      .maybeSingle();
    if (!sesion) return Response.json({ error: "Misión no encontrada." }, { status: 404 });

    objetivo = sesion.objetivo;
    foco = sesion.foco;
    horizonte = sesion.horizonte;
    proyectoId = sesion.proyecto_id;

    const { data: vueltas } = await supabase
      .from("lancelot_vueltas")
      .select("numero, salida")
      .eq("sesion_id", sesion.id)
      .order("numero", { ascending: false })
      .limit(2);
    numero = (vueltas?.[0]?.numero ?? 0) + 1;
    historial = (vueltas ?? [])
      .reverse()
      .map((vuelta) => {
        const salida = respuestaLancelotSchema.safeParse(vuelta.salida);
        if (!salida.success) return `Vuelta ${vuelta.numero}: sin resumen válido.`;
        return `Vuelta ${vuelta.numero}: prioridad=${salida.data.prioridad.titulo}; indicador=${salida.data.indicador.nombre}; pregunta=${salida.data.siguiente_pregunta}`;
      })
      .join("\n");
  }

  // Solo se envían métricas agregadas y anonimizadas. Nombres, correos, empresas,
  // valores contractuales e identificadores permanecen en Supabase.
  const [{ data: proyectos }, { count: clientes }, { data: prospectos }] = await Promise.all([
    supabase.from("proyectos").select("id, estado_comercial, fase_metodologica").eq("consultor_id", consultor.id),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("consultor_id", consultor.id),
    supabase.rpc("listar_prospectos_demo"),
  ]);
  const seleccionado = proyectoId ? (proyectos ?? []).find((proyecto) => proyecto.id === proyectoId) : null;
  if (proyectoId && !seleccionado) {
    return Response.json({ error: "El proyecto elegido no existe o no te pertenece." }, { status: 404 });
  }

  const detalle = proyectoId ? await contarProyecto(proyectoId) : "Sin proyecto específico.";
  const completaron = (prospectos ?? []).filter((prospecto) => prospecto.completed_at).length;
  const portafolio = (proyectos ?? [])
    .map((proyecto, index) => `P${index + 1}: ${proyecto.estado_comercial}/${proyecto.fase_metodologica}`)
    .join(" | ");
  const contexto = [
    `Clientes: ${clientes ?? 0}. Prospectos: ${prospectos?.length ?? 0}; completaron: ${completaron}.`,
    `Portafolio anónimo: ${portafolio || "sin proyectos"}.`,
    seleccionado ? `Proyecto elegido: ${seleccionado.estado_comercial}/${seleccionado.fase_metodologica}. ${detalle}.` : detalle,
  ].join("\n");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let response;
  try {
    response = await anthropic.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS_SALIDA,
      temperature: 0.2,
      system: LANCELOT_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: construirPromptLancelot({
          objetivo,
          foco,
          horizonte,
          contexto,
          historial,
          retroalimentacion: parsed.data.retroalimentacion,
        }),
      }],
    });
  } catch (error) {
    console.error("[lancelot-loop] fallo llamando a Anthropic:", error);
    return Response.json({ error: "Lancelot no pudo analizar esta vuelta." }, { status: 502 });
  }

  const texto = response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
  let salida;
  try {
    salida = parsearRespuestaLancelot(texto);
  } catch (error) {
    console.error("[lancelot-loop] respuesta estructurada inválida:", error);
    return Response.json({ error: "Lancelot produjo una respuesta incompleta. Intenta otra vez." }, { status: 502 });
  }

  if (!sesionId) {
    const { data: nuevaSesion, error } = await supabase
      .from("lancelot_sesiones")
      .insert({ consultor_id: consultor.id, proyecto_id: proyectoId, objetivo, foco, horizonte })
      .select("id")
      .single();
    if (error || !nuevaSesion) {
      console.error("[lancelot-loop] no se pudo crear la sesión:", error);
      return Response.json({ error: "El análisis se generó, pero no se pudo guardar la misión." }, { status: 500 });
    }
    sesionId = nuevaSesion.id;
  }

  const salidaJson = respuestaLancelotSchema.parse(salida) as unknown as Record<string, unknown>;
  const { error: errorVuelta } = await supabase.from("lancelot_vueltas").insert({
    sesion_id: sesionId,
    numero,
    retroalimentacion: parsed.data.retroalimentacion ?? null,
    salida: salidaJson,
  });
  if (errorVuelta) {
    console.error("[lancelot-loop] no se pudo guardar la vuelta:", errorVuelta);
    return Response.json({ error: "No se pudo guardar esta vuelta del loop." }, { status: 500 });
  }

  await Promise.all([
    supabase.from("lancelot_sesiones").update({ updated_at: new Date().toISOString() }).eq("id", sesionId),
    registrarLlamadaIA({
      consultorId: consultor.id,
      proyectoId,
      endpoint: "lancelot-loop",
      modelo: MODELO,
      tokensEntrada: response.usage?.input_tokens ?? null,
      tokensSalida: response.usage?.output_tokens ?? null,
    }),
  ]);

  return Response.json({ sesionId, numero, salida });
}

