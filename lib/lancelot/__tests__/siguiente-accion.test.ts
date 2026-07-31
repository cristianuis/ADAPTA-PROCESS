import { describe, expect, it } from "vitest";
import {
  construirGuiaLancelot,
  type ClienteGuia,
  type ProyectoGuia,
} from "@/lib/lancelot/siguiente-accion";

const cliente: ClienteGuia = {
  id: "cliente-1",
  nombre: "Empresa Uno",
  createdAt: "2026-01-01T00:00:00Z",
};

function proyecto(overrides: Partial<ProyectoGuia> = {}): ProyectoGuia {
  return {
    id: "proyecto-1",
    clienteId: cliente.id,
    cliente: cliente.nombre,
    nombre: "Diagnóstico",
    estado: "contratado",
    createdAt: "2026-01-02T00:00:00Z",
    completitud: new Array(12).fill(false),
    ...overrides,
  };
}

describe("construirGuiaLancelot", () => {
  it("empieza registrando la empresa cuando todavía no hay datos", () => {
    const guia = construirGuiaLancelot({ clientes: [], proyectos: [] });
    expect(guia.accion.tipo).toBe("registrar_empresa");
    expect(guia.accion.href).toBe("/clientes/nuevo");
  });

  it("crea el proyecto cuando la empresa existe pero aún no tiene uno", () => {
    const guia = construirGuiaLancelot({ clientes: [cliente], proyectos: [] });
    expect(guia.accion.tipo).toBe("crear_proyecto");
    expect(guia.accion.href).toBe(`/proyectos/nuevo?clienteId=${cliente.id}`);
  });

  it("indica una sola acción para el primer paso incompleto", () => {
    const completitud = [true, true, true, false, ...new Array(8).fill(false)];
    const guia = construirGuiaLancelot({
      clientes: [cliente],
      proyectos: [proyecto({ completitud })],
    });
    expect(guia.accion.tipo).toBe("continuar_recorrido");
    expect(guia.accion.pasoActual).toBe(4);
    expect(guia.accion.href).toBe("/proyectos/proyecto-1/pemm");
    expect(guia.accion.pasosCompletos).toBe(3);
  });

  it("reconoce que el recorrido terminó", () => {
    const guia = construirGuiaLancelot({
      clientes: [cliente],
      proyectos: [proyecto({ completitud: new Array(12).fill(true) })],
    });
    expect(guia.accion.tipo).toBe("proyecto_completo");
    expect(guia.accion.pasosCompletos).toBe(12);
  });

  it("prioriza trabajo contratado sobre un prospecto", () => {
    const guia = construirGuiaLancelot({
      clientes: [cliente],
      proyectos: [
        proyecto({ id: "prospecto", estado: "prospecto", createdAt: "2025-01-01T00:00:00Z" }),
        proyecto({ id: "contratado", estado: "contratado", createdAt: "2026-01-01T00:00:00Z" }),
      ],
    });
    expect(guia.accion.proyectoId).toBe("contratado");
  });

  it("respeta el proyecto que el consultor eligió", () => {
    const guia = construirGuiaLancelot({
      clientes: [cliente],
      proyectos: [proyecto({ id: "a" }), proyecto({ id: "b", estado: "prospecto" })],
      proyectoSeleccionadoId: "b",
    });
    expect(guia.accion.proyectoId).toBe("b");
  });
});
