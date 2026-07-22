import { z } from "zod";

const nivel1a5 = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export const hallazgoManualSchema = z.object({
  proyectoId: z.string().uuid(),
  titulo: z.string().trim().min(2, "El título es obligatorio"),
  descripcion: z.string().trim().optional().or(z.literal("")),
  categoria: z.enum(["proceso", "gobierno", "tecnologia", "cultura", "datos"]),
  impacto: nivel1a5,
  esfuerzo: nivel1a5,
  fuente: z.enum(["entrevista", "observacion", "documental", "financiero"]),
});

export type HallazgoManualInput = z.infer<typeof hallazgoManualSchema>;
