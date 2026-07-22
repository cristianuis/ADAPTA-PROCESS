import { z } from "zod";

export const medicionSchema = z.object({
  indicadorId: z.string().uuid(),
  periodo: z.string().trim().min(1, "El periodo es obligatorio"),
  valor: z.coerce.number(),
  observaciones: z.string().trim().optional().or(z.literal("")),
});

export type MedicionInput = z.infer<typeof medicionSchema>;
