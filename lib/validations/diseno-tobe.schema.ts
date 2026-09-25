import { z } from "zod";

export const disenoTobeSchema = z.object({
  procesoId: z.string().uuid(),
  objetivo: z.string().trim().min(10, "Describe el objetivo del proceso futuro"),
  criterioValidacion: z.string().trim().min(10, "Define cómo se validará el diseño"),
  decisiones: z.string().trim().min(10, "Explica los cambios y exclusiones del AS-IS"),
});

export const pasoTobeSchema = z.object({
  disenoId: z.string().uuid(),
  nombre: z.string().trim().min(2),
  responsable: z.string().trim().min(2, "Indica un rol responsable"),
  cambio: z.string().trim().min(10, "Explica qué cambiará y por qué"),
  tipoCambio: z.enum(["conservar", "modificar", "nuevo"]),
  automatizacion: z.enum(["manual", "asistida", "candidata"]),
  hallazgoId: z.string().uuid().nullable(),
}).refine((valor) => valor.tipoCambio === "conservar" || valor.hallazgoId !== null, {
  message: "Un paso nuevo o modificado debe enlazar un hallazgo",
  path: ["hallazgoId"],
});

export type DisenoTobeInput = z.infer<typeof disenoTobeSchema>;
export type PasoTobeInput = z.infer<typeof pasoTobeSchema>;
