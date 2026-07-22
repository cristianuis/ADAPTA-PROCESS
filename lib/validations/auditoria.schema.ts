import { z } from "zod";

export const auditoriaSchema = z.object({
  proyectoId: z.string().uuid(),
  procesoId: z.string().uuid(),
  fecha: z.string().trim().min(1),
  casosRevisados: z.coerce.number().int().min(1, "Debe revisar al menos un caso"),
  casosConformes: z.coerce.number().int().min(0),
  desviaciones: z.array(z.string()).default([]),
  causasIdentificadas: z.string().trim().optional().or(z.literal("")),
});

export type AuditoriaInput = z.infer<typeof auditoriaSchema>;

export const causasIdentificadasSchema = z.object({
  auditoriaId: z.string().uuid(),
  proyectoId: z.string().uuid(),
  causas: z.string().trim().max(4000, "Máximo 4000 caracteres"),
});

export type CausasIdentificadasInput = z.infer<typeof causasIdentificadasSchema>;
