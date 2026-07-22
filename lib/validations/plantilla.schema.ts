import { z } from "zod";

export const plantillaSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  sector: z.string().trim().optional().or(z.literal("")),
  tipoProceso: z.string().trim().optional().or(z.literal("")),
  descripcion: z.string().trim().optional().or(z.literal("")),
});

export type PlantillaInput = z.infer<typeof plantillaSchema>;

export const aplicarPlantillaSchema = z.object({
  plantillaId: z.string().uuid(),
  proyectoId: z.string().uuid(),
  nombreProceso: z.string().trim().min(2, "El nombre del proceso es obligatorio"),
});

export type AplicarPlantillaInput = z.infer<typeof aplicarPlantillaSchema>;

export const benchmarkSchema = z.object({
  sector: z.string().trim().min(2, "El sector es obligatorio"),
  indicador: z.string().trim().min(2, "El indicador es obligatorio"),
  valorP25: z.coerce.number().optional().nullable(),
  valorMediana: z.coerce.number().optional().nullable(),
  valorP75: z.coerce.number().optional().nullable(),
  numObservaciones: z.coerce.number().int().min(1).default(1),
});

export type BenchmarkInput = z.infer<typeof benchmarkSchema>;
