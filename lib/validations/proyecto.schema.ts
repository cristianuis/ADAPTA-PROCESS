import { z } from "zod";

export const ESTADOS_PROYECTO = [
  "prospecto",
  "diagnostico",
  "definicion",
  "arquitectura",
  "pilotaje",
  "transferencia",
  "anclaje",
  "cerrado",
] as const;

export const proyectoSchema = z.object({
  clienteId: z.string().uuid("Selecciona un cliente"),
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  estado: z.enum(ESTADOS_PROYECTO),
  fechaInicio: z.string().trim().optional().or(z.literal("")),
  fechaFinEstimada: z.string().trim().optional().or(z.literal("")),
  valorContrato: z.coerce.number().positive().optional().nullable(),
  modeloCobro: z.string().trim().optional().or(z.literal("")),
});

export type ProyectoInput = z.infer<typeof proyectoSchema>;

export const estadoProyectoSchema = z.object({
  estado: z.enum(ESTADOS_PROYECTO),
});
