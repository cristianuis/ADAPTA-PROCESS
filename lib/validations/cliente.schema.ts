import { z } from "zod";

export const clienteSchema = z.object({
  razonSocial: z.string().trim().min(2, "La razón social es obligatoria"),
  nit: z.string().trim().optional().or(z.literal("")),
  sector: z.string().trim().optional().or(z.literal("")),
  subsector: z.string().trim().optional().or(z.literal("")),
  numEmpleados: z.coerce.number().int().positive().optional().nullable(),
  facturacionAnual: z.coerce.number().positive().optional().nullable(),
  ciudad: z.string().trim().optional().or(z.literal("")),
  contactoNombre: z.string().trim().optional().or(z.literal("")),
  contactoCargo: z.string().trim().optional().or(z.literal("")),
  contactoEmail: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  contactoTelefono: z.string().trim().optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
