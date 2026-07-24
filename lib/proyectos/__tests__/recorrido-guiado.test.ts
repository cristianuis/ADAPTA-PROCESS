import { describe, expect, it } from "vitest";
import { calcularEstadosPasos, PASOS_RECORRIDO } from "@/lib/proyectos/recorrido-guiado";

const TODO_INCOMPLETO = new Array(12).fill(false);
const TODO_COMPLETO = new Array(12).fill(true);

describe("calcularEstadosPasos", () => {
  it("con todo incompleto, el paso 1 es 'actual' y el resto 'pendiente' (paso 1 no tiene prerrequisito)", () => {
    const pasos = calcularEstadosPasos(TODO_INCOMPLETO);
    expect(pasos[0].estado).toBe("actual");
    expect(pasos[1].estado).toBe("fuera_de_secuencia"); // triage depende de cliente, que aún no está "completo" en este escenario artificial
  });

  it("con todo completo, todos los pasos son 'completado' y ninguno es 'actual'", () => {
    const pasos = calcularEstadosPasos(TODO_COMPLETO);
    expect(pasos.every((p) => p.estado === "completado")).toBe(true);
  });

  it("marca 'actual' el primer paso incompleto en orden numérico", () => {
    const completitud = [true, true, false, false, false, false, false, false, false, false, false, false];
    const pasos = calcularEstadosPasos(completitud);
    expect(pasos[2].estado).toBe("actual"); // paso 3 = PEMM empresa
  });

  it("PEMM proceso (paso 4) es 'pendiente' — no 'fuera_de_secuencia' — cuando triage está listo pero PEMM empresa (paso 3, el 'actual') todavía no, porque corren en paralelo", () => {
    // cliente, triage completos; PEMM empresa (actual) incompleto; PEMM proceso también incompleto
    const completitud = [true, true, false, false, false, false, false, false, false, false, false, false];
    const pasos = calcularEstadosPasos(completitud);
    expect(pasos[3].estado).toBe("pendiente"); // paso 4 = PEMM proceso, prereq = paso 2 (triage), que sí está completo
  });

  it("marca 'fuera_de_secuencia' un paso cuyo prerrequisito real no está cumplido", () => {
    // cliente y triage completos, pero nada más — validar hallazgos (paso 6) depende de
    // entrevistas (paso 5), que está incompleto
    const completitud = [true, true, false, false, false, false, false, false, false, false, false, false];
    const pasos = calcularEstadosPasos(completitud);
    expect(pasos[5].estado).toBe("fuera_de_secuencia"); // paso 6, prereq = paso 5 (entrevistas), incompleto
  });

  it("un paso completo siempre es 'completado', incluso si aparece después del primer incompleto (completado fuera de orden)", () => {
    // escenario anómalo: paso 5 (entrevistas) completo, pero paso 2 (triage) no —
    // el consultor avanzó sin triage. El paso 5 igual debe verse como completado.
    const completitud = [true, false, false, false, true, false, false, false, false, false, false, false];
    const pasos = calcularEstadosPasos(completitud);
    expect(pasos[1].estado).toBe("actual"); // paso 2, primer incompleto
    expect(pasos[4].estado).toBe("completado"); // paso 5, ya completo, no importa el orden
  });

  it("PASOS_RECORRIDO tiene exactamente 12 pasos numerados 1..12", () => {
    expect(PASOS_RECORRIDO).toHaveLength(12);
    expect(PASOS_RECORRIDO.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
