import { describe, expect, it } from "vitest";
import {
  construirPromptLancelot,
  LANCELOT_SYSTEM_PROMPT,
  parsearRespuestaLancelot,
} from "@/lib/lancelot/prompt";

const respuestaValida = {
  lectura: "Existe una oportunidad comercial sin siguiente paso registrado.",
  evidencia: ["Hecho: hay un prospecto con diagnóstico terminado."],
  prioridad: {
    titulo: "Convertir el diagnóstico en conversación",
    por_que_ahora: "La señal de interés ya existe.",
    resultado_esperado: "Reunión de descubrimiento agendada.",
  },
  acciones: [
    {
      tarea: "Contactar al prospecto",
      resultado: "Respuesta y fecha propuesta",
      tiempo_estimado: "20 minutos",
    },
  ],
  indicador: {
    nombre: "Reuniones agendadas",
    meta: "1 antes del viernes",
    momento_revision: "Viernes 5:00 p. m.",
  },
  riesgos: ["El prospecto puede no tener urgencia."],
  siguiente_pregunta: "¿Qué respondió el prospecto?",
};

describe("Lancelot Loop", () => {
  it("obliga a cerrar el ciclo con evidencia, métrica y aprendizaje", () => {
    expect(LANCELOT_SYSTEM_PROMPT).toContain("OBSERVAR");
    expect(LANCELOT_SYSTEM_PROMPT).toContain("VERIFICAR");
    expect(LANCELOT_SYSTEM_PROMPT).toContain("APRENDER");
    expect(LANCELOT_SYSTEM_PROMPT).toContain("No inventes");
  });

  it("construye una vuelta con misión, contexto y retroalimentación", () => {
    const prompt = construirPromptLancelot({
      objetivo: "Cerrar un diagnóstico pagado",
      foco: "comercial",
      horizonte: "semana",
      contexto: "1 prospecto completó el diagnóstico.",
      retroalimentacion: "Respondió y pidió una llamada.",
    });
    expect(prompt).toContain("Cerrar un diagnóstico pagado");
    expect(prompt).toContain("1 prospecto completó");
    expect(prompt).toContain("Respondió y pidió una llamada");
  });

  it("acepta JSON limpio o envuelto en un bloque de código", () => {
    const json = JSON.stringify(respuestaValida);
    expect(parsearRespuestaLancelot(json).prioridad.titulo).toContain("Convertir");
    expect(parsearRespuestaLancelot(`\`\`\`json\n${json}\n\`\`\``).acciones).toHaveLength(1);
  });

  it("rechaza una salida sin indicador verificable", () => {
    const invalida = { ...respuestaValida, indicador: undefined };
    expect(() => parsearRespuestaLancelot(JSON.stringify(invalida))).toThrow();
  });
});

