import { z } from "zod";

export const indicadorSchema = z.object({
  procesoId: z.string().uuid(),
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  tipo: z.enum(["eficacia", "eficiencia", "calidad"]),
  formula: z.string().trim().optional().or(z.literal("")),
  unidad: z.string().trim().optional().or(z.literal("")),
  // No negociable (blueprint Módulo 6.5): un indicador sin fuente de datos ni mecanismo
  // de captura no se puede guardar — refleja una regla del método, no una preferencia de UX.
  fuenteDatos: z.string().trim().min(2, "La fuente de datos es obligatoria — un indicador sin ella no se puede guardar"),
  mecanismoCaptura: z
    .string()
    .trim()
    .min(2, "El mecanismo de captura es obligatorio — un indicador sin él no se puede guardar"),
  frecuencia: z.string().trim().optional().or(z.literal("")),
  meta: z.coerce.number().optional().nullable(),
  responsable: z.string().trim().optional().or(z.literal("")),
});

export type IndicadorInput = z.infer<typeof indicadorSchema>;
