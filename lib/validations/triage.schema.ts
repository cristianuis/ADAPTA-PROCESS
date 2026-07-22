import { z } from "zod";

const puntaje = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const triageSchema = z.object({
  proyectoId: z.string().uuid(),
  p1: puntaje,
  p2: puntaje,
  p3: puntaje,
  p4: puntaje,
  p5: z.enum(["crecimiento", "problema", "requisito_externo"]),
  p6: puntaje,
  notas: z.string().trim().optional().or(z.literal("")),
});

export type TriageFormInput = z.infer<typeof triageSchema>;
