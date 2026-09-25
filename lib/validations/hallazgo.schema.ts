import { z } from "zod";

const nivel1a5 = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export const hallazgoManualSchema = z.object({
  proyectoId: z.string().uuid(),
  procesoId: z.string().uuid().nullable(),
  titulo: z.string().trim().min(2, "El título es obligatorio"),
  descripcion: z.string().trim().optional().or(z.literal("")),
  categoria: z.enum(["proceso", "gobierno", "tecnologia", "cultura", "datos"]),
  citaSoporte: z.string().trim().min(10, "Registra la evidencia o referencia que sustenta el hallazgo"),
  impacto: nivel1a5,
  esfuerzo: nivel1a5,
  fuente: z.enum(["entrevista", "observacion", "documental", "financiero"]),
  fuenteId: z.string().uuid().nullable(),
}).superRefine((value, context) => {
  if (value.fuente === "entrevista" && !value.fuenteId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["fuenteId"], message: "Selecciona la entrevista que contiene la cita" });
  }
  if (value.fuente !== "entrevista" && value.fuenteId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["fuenteId"], message: "Esta fuente no corresponde a una entrevista" });
  }
});

export type HallazgoManualInput = z.infer<typeof hallazgoManualSchema>;
