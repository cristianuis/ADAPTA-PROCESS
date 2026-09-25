import { describe, expect, it } from "vitest";
import { disenoTobeSchema, pasoTobeSchema } from "../diseno-tobe.schema";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("diseño TO-BE", () => {
  it("requiere un criterio de validación observable", () => {
    expect(disenoTobeSchema.safeParse({
      procesoId: id,
      objetivo: "Reducir retrabajo de pedidos",
      criterioValidacion: "",
      decisiones: "Unificar las entradas y salidas",
    }).success).toBe(false);
  });

  it("no permite proponer cambios sin hallazgo vinculado", () => {
    const base = {
      disenoId: id,
      nombre: "Validar pedido",
      responsable: "Coordinador",
      cambio: "Incluir validación automática",
      tipoCambio: "modificar" as const,
      automatizacion: "candidata" as const,
      hallazgoId: null,
    };
    expect(pasoTobeSchema.safeParse(base).success).toBe(false);
    expect(pasoTobeSchema.safeParse({ ...base, hallazgoId: id }).success).toBe(true);
  });
});
