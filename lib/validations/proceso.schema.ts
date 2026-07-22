import { z } from "zod";

export const procesoSchema = z.object({
  proyectoId: z.string().uuid(),
  codigo: z.string().trim().optional().or(z.literal("")),
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  tipo: z.enum(["estrategico", "misional", "apoyo"]),
  objetivo: z.string().trim().optional().or(z.literal("")),
  alcanceInicio: z.string().trim().optional().or(z.literal("")),
  alcanceFin: z.string().trim().optional().or(z.literal("")),
  duenoNombre: z.string().trim().optional().or(z.literal("")),
  duenoCargo: z.string().trim().optional().or(z.literal("")),
  prioridad: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

export type ProcesoInput = z.infer<typeof procesoSchema>;

export const estadoProcesoSchema = z.object({
  estado: z.enum(["identificado", "diseno", "piloto", "operando"]),
});
