import { z } from "zod";

export const SENTIDOS_INDICADOR = [
  "mayor_es_mejor",
  "menor_es_mejor",
  "rango_objetivo",
] as const;

export const indicadorSchema = z
  .object({
    procesoId: z.string().uuid(),
    nombre: z.string().trim().min(2, "El nombre es obligatorio"),
    tipo: z.enum(["eficacia", "eficiencia", "calidad"]),
    formula: z.string().trim().optional().or(z.literal("")),
    unidad: z.string().trim().optional().or(z.literal("")),
    fuenteDatos: z
      .string()
      .trim()
      .min(2, "La fuente de datos es obligatoria — un indicador sin ella no se puede guardar"),
    mecanismoCaptura: z
      .string()
      .trim()
      .min(2, "El mecanismo de captura es obligatorio — un indicador sin él no se puede guardar"),
    frecuencia: z.string().trim().optional().or(z.literal("")),
    meta: z.number().optional().nullable(),
    responsable: z.string().trim().optional().or(z.literal("")),
    sentido: z.enum(SENTIDOS_INDICADOR, {
      required_error: "El sentido del indicador es obligatorio",
    }),
    limiteInferior: z.number().optional().nullable(),
    limiteSuperior: z.number().optional().nullable(),
  })
  .superRefine((valor, contexto) => {
    if (valor.sentido !== "rango_objetivo") return;

    if (valor.limiteInferior == null) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limiteInferior"],
        message: "El límite inferior es obligatorio para un rango objetivo",
      });
    }
    if (valor.limiteSuperior == null) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limiteSuperior"],
        message: "El límite superior es obligatorio para un rango objetivo",
      });
    }
    if (
      valor.limiteInferior != null &&
      valor.limiteSuperior != null &&
      valor.limiteInferior > valor.limiteSuperior
    ) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limiteSuperior"],
        message: "El límite superior debe ser mayor o igual al inferior",
      });
    }
  });

export type IndicadorInput = z.infer<typeof indicadorSchema>;
