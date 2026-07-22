import { z } from "zod";

export const sipocSchema = z.object({
  procesoId: z.string().uuid(),
  proveedores: z.array(z.string()).max(7),
  entradas: z.array(z.string()).max(7),
  pasos: z.array(z.string()).max(7, "Máximo 5-7 pasos — un SIPOC no detalla cada micro-actividad"),
  salidas: z.array(z.string()).max(7),
  clientes: z.array(z.string()).max(7),
});

export type SipocInput = z.infer<typeof sipocSchema>;
