import { z } from "zod";

export const actividadSchema = z.object({
  procesoId: z.string().uuid(),
  orden: z.number().int().min(1),
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  descripcion: z.string().trim().optional().or(z.literal("")),
  rolResponsable: z.string().trim().optional().or(z.literal("")),
  rolAprobador: z.string().trim().optional().or(z.literal("")),
  rolesConsultados: z.array(z.string()).default([]),
  rolesInformados: z.array(z.string()).default([]),
  tiempoEstimadoMin: z.coerce.number().int().positive().optional().nullable(),
  esValorAgregado: z.boolean().default(true),
  sistemaSoporte: z.string().trim().optional().or(z.literal("")),
});

export type ActividadInput = z.infer<typeof actividadSchema>;
