import { z } from "zod";

const nivel1a4 = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const pemmProcesoSchema = z.object({
  proyectoId: z.string().uuid(),
  procesoEvaluado: z.string().trim().min(2, "Indica qué proceso se evalúa"),
  diseno: nivel1a4,
  ejecutores: nivel1a4,
  responsable: nivel1a4,
  infraestructura: nivel1a4,
  indicadores: nivel1a4,
  evidencias: z.record(z.string(), z.string()).optional(),
});

export const pemmEmpresaSchema = z.object({
  proyectoId: z.string().uuid(),
  liderazgo: nivel1a4,
  cultura: nivel1a4,
  experiencia: nivel1a4,
  gobierno: nivel1a4,
  evidencias: z.record(z.string(), z.string()).optional(),
});

export type PemmProcesoInput = z.infer<typeof pemmProcesoSchema>;
export type PemmEmpresaInput = z.infer<typeof pemmEmpresaSchema>;

export const invitacionPemmSchema = z.object({
  proyectoId: z.string().uuid(),
  tipo: z.enum(["proceso", "empresa"]),
  procesoEvaluado: z.string().trim().optional().or(z.literal("")),
  respondienteNivel: z.enum(["direccion", "mando_medio", "operacion"]),
  respondienteNombre: z.string().trim().optional().or(z.literal("")),
});

export type InvitacionPemmInput = z.infer<typeof invitacionPemmSchema>;

export const respuestaPublicaPemmSchema = z.object({
  token: z.string().uuid(),
  diseno: nivel1a4.optional(),
  ejecutores: nivel1a4.optional(),
  responsable: nivel1a4.optional(),
  infraestructura: nivel1a4.optional(),
  indicadores: nivel1a4.optional(),
  liderazgo: nivel1a4.optional(),
  cultura: nivel1a4.optional(),
  experiencia: nivel1a4.optional(),
  gobierno: nivel1a4.optional(),
});

export type RespuestaPublicaPemmInput = z.infer<typeof respuestaPublicaPemmSchema>;
