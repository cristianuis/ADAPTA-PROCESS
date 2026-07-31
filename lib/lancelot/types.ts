import { z } from "zod";

export const focoLancelotSchema = z.enum(["comercial", "entrega", "sistema"]);
export const horizonteLancelotSchema = z.enum(["hoy", "semana", "mes"]);

export const lancelotRequestSchema = z
  .object({
    objetivo: z.string().trim().min(12).max(600).optional(),
    foco: focoLancelotSchema.optional(),
    horizonte: horizonteLancelotSchema.optional(),
    proyectoId: z.string().uuid().nullable().optional(),
    sesionId: z.string().uuid().optional(),
    retroalimentacion: z.string().trim().min(3).max(1200).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.sesionId && (!value.objetivo || !value.foco || !value.horizonte)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Una misión nueva requiere objetivo, foco y horizonte.",
      });
    }
    if (value.sesionId && !value.retroalimentacion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para continuar una misión debes registrar qué ocurrió.",
      });
    }
  });

export const accionLancelotSchema = z.object({
  tarea: z.string().min(1),
  resultado: z.string().min(1),
  tiempo_estimado: z.string().min(1),
});

export const respuestaLancelotSchema = z.object({
  lectura: z.string().min(1),
  evidencia: z.array(z.string().min(1)).min(1).max(4),
  prioridad: z.object({
    titulo: z.string().min(1),
    por_que_ahora: z.string().min(1),
    resultado_esperado: z.string().min(1),
  }),
  acciones: z.array(accionLancelotSchema).min(1).max(3),
  indicador: z.object({
    nombre: z.string().min(1),
    meta: z.string().min(1),
    momento_revision: z.string().min(1),
  }),
  riesgos: z.array(z.string().min(1)).max(3),
  siguiente_pregunta: z.string().min(1),
});

export type FocoLancelot = z.infer<typeof focoLancelotSchema>;
export type HorizonteLancelot = z.infer<typeof horizonteLancelotSchema>;
export type RespuestaLancelot = z.infer<typeof respuestaLancelotSchema>;

export interface ProyectoLancelot {
  id: string;
  nombre: string;
  cliente: string;
  fase: string;
  estado: string;
}

export interface VueltaLancelot {
  id: string;
  numero: number;
  retroalimentacion: string | null;
  salida: RespuestaLancelot;
  created_at: string;
}

export interface SesionLancelot {
  id: string;
  objetivo: string;
  foco: FocoLancelot;
  horizonte: HorizonteLancelot;
  proyecto_id: string | null;
  estado: "activa" | "cerrada";
  created_at: string;
  updated_at: string;
  vueltas: VueltaLancelot[];
}

export interface SesionLancelotResumen {
  id: string;
  objetivo: string;
  foco: FocoLancelot;
  updated_at: string;
}

