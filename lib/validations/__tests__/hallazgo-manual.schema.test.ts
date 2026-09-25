import { describe, expect, it } from "vitest";
import { hallazgoManualSchema } from "@/lib/validations/hallazgo.schema";

const base = {
  proyectoId: "11111111-1111-4111-8111-111111111111",
  procesoId: null,
  titulo: "Autorización duplicada",
  descripcion: "",
  categoria: "proceso" as const,
  citaSoporte: "La firma tarda dos días",
  impacto: 3 as const,
  esfuerzo: 2 as const,
};

describe("hallazgo manual y fuente", () => {
  it("exige una entrevista identificable cuando se declara esa fuente", () => {
    expect(hallazgoManualSchema.safeParse({ ...base, fuente: "entrevista", fuenteId: null }).success).toBe(false);
    expect(hallazgoManualSchema.safeParse({ ...base, fuente: "entrevista", fuenteId: "22222222-2222-4222-8222-222222222222" }).success).toBe(true);
  });

  it("no permite adjuntar una entrevista como si fuese observación", () => {
    expect(hallazgoManualSchema.safeParse({ ...base, fuente: "observacion", fuenteId: "22222222-2222-4222-8222-222222222222" }).success).toBe(false);
  });
});
