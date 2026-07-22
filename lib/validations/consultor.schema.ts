import { z } from "zod";

export const consultorSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto"),
  empresa: z.string().trim().optional().or(z.literal("")),
  colorPrimario: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hex válido, ej: #1A4731"),
  colorSecundario: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color hex válido, ej: #C8D830"),
  tarifaHoraObjetivo: z.coerce.number().positive().optional().nullable(),
});

export type ConsultorInput = z.infer<typeof consultorSchema>;
