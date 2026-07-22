import { z } from "zod";

export const entrevistaSchema = z.object({
  proyectoId: z.string().uuid(),
  entrevistadoNombre: z.string().trim().min(2, "El nombre es obligatorio"),
  entrevistadoCargo: z.string().trim().optional().or(z.literal("")),
  nivel: z.enum(["direccion", "mando_medio", "operacion"]),
  fecha: z.string().trim().optional().or(z.literal("")),
  transcripcion: z.string().trim().optional().or(z.literal("")),
});

export type EntrevistaInput = z.infer<typeof entrevistaSchema>;

export const guardarTranscripcionSchema = z.object({
  entrevistaId: z.string().uuid(),
  transcripcion: z.string().trim().min(20, "La transcripción es muy corta para analizar"),
  // Auditoría 2.2: reanalizar una entrevista que ya tiene hallazgos_validados puede
  // desalinear el `indice` guardado en hallazgos_validados si el nuevo análisis devuelve
  // un orden/cantidad distinta de hallazgos. El servidor exige este flag explícito antes
  // de sobrescribir — nunca sobrescribe en silencio.
  confirmarSobrescritura: z.boolean().optional(),
});

export const hallazgoIASchema = z.object({
  titulo: z.string(),
  descripcion: z.string(),
  categoria: z.enum(["proceso", "gobierno", "tecnologia", "cultura", "datos"]),
  impacto_estimado: z.number().min(1).max(5),
  cita_soporte: z.string().min(10, "La cita de soporte debe tener contenido real"),
  confianza: z.enum(["alta", "media", "baja"]),
});

export const analisisEntrevistaSchema = z.object({
  hallazgos: z.array(hallazgoIASchema),
  procesos_mencionados: z.array(z.string()),
  nivel_resistencia: z.enum(["bajo", "medio", "alto"]),
  senales_gobierno: z.array(z.string()),
});

export type AnalisisEntrevista = z.infer<typeof analisisEntrevistaSchema>;

export const validarHallazgoSchema = z.object({
  entrevistaId: z.string().uuid(),
  proyectoId: z.string().uuid(),
  indice: z.number().int().min(0),
  esfuerzo: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  impacto: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
});

export type ValidarHallazgoInput = z.infer<typeof validarHallazgoSchema>;
