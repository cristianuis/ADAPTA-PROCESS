import { describe, expect, it } from "vitest";
import { generarMatrizRaci } from "@/lib/procesos/generar-raci";
import type { Database } from "@/lib/supabase/types";

type Actividad = Database["public"]["Tables"]["actividades"]["Row"];

function act(overrides: Partial<Actividad>): Actividad {
  return {
    id: "1",
    proceso_id: "p1",
    orden: 1,
    nombre: "Actividad",
    descripcion: null,
    rol_responsable: null,
    rol_aprobador: null,
    roles_consultados: [],
    roles_informados: [],
    tiempo_estimado_min: null,
    es_valor_agregado: true,
    sistema_soporte: null,
    ...overrides,
  };
}

describe("generarMatrizRaci", () => {
  it("asigna R al responsable y A al aprobador", () => {
    const matriz = generarMatrizRaci([
      act({ orden: 1, nombre: "Recibir pedido", rol_responsable: "Vendedor", rol_aprobador: "Gerente" }),
    ]);
    expect(matriz.filas[0].celdas["Vendedor"]).toBe("R");
    expect(matriz.filas[0].celdas["Gerente"]).toBe("A");
  });

  it("marca C para consultados e I para informados", () => {
    const matriz = generarMatrizRaci([
      act({
        orden: 1,
        nombre: "Aprobar descuento",
        rol_responsable: "Vendedor",
        roles_consultados: ["Finanzas"],
        roles_informados: ["Bodega"],
      }),
    ]);
    expect(matriz.filas[0].celdas["Finanzas"]).toBe("C");
    expect(matriz.filas[0].celdas["Bodega"]).toBe("I");
  });

  it("ordena las filas por el campo orden, no por el orden de inserción", () => {
    const matriz = generarMatrizRaci([
      act({ orden: 2, nombre: "Segunda", rol_responsable: "A" }),
      act({ orden: 1, nombre: "Primera", rol_responsable: "A" }),
    ]);
    expect(matriz.filas[0].actividad).toBe("Primera");
    expect(matriz.filas[1].actividad).toBe("Segunda");
  });
});
