import { z } from "zod";

const monto = z.number().finite().min(0, "El valor no puede ser negativo");

export const cuantificacionImpactoSchema = z.object({
  proyectoId: z.string().uuid(),
  hallazgoId: z.string().uuid(),
  nombre: z.string().trim().min(3, "Describe el componente de impacto"),
  tipo: z.enum(["ahorro", "ingreso", "costo_evitado", "capacidad_liberada", "riesgo_reducido"]),
  valorUnitario: monto,
  volumenPeriodo: monto,
  periodosAnio: z.number().finite().positive("Los periodos deben ser mayores que cero"),
  porcentajeCapturable: z.number().finite().min(0).max(100),
  moneda: z.string().trim().regex(/^[A-Z]{3}$/, "Usa un código de moneda de tres letras"),
  fuenteCalculo: z.string().trim().min(3, "Registra la fuente del cálculo"),
  supuestos: z.string().trim().min(3, "Explica los supuestos del cálculo"),
  confianza: z.enum(["baja", "media", "alta"]),
  validadoCliente: z.boolean(),
});

export const iniciativaMejoraSchema = z
  .object({
    proyectoId: z.string().uuid(),
    hallazgoIds: z.array(z.string().uuid()).min(1, "Vincula al menos un hallazgo"),
    titulo: z.string().trim().min(3, "El título es obligatorio"),
    descripcion: z.string().trim().optional().or(z.literal("")),
    hipotesis: z.string().trim().min(10, "Explica por qué esta intervención resolverá el problema"),
    resultadoEsperado: z.string().trim().min(5, "Define el resultado esperado"),
    criterioExito: z.string().trim().min(5, "Define cómo sabrás que funcionó"),
    prioridad: z.number().int().min(1).max(5),
    responsable: z.string().trim().optional().or(z.literal("")),
    fechaInicio: z.string().optional().or(z.literal("")),
    fechaObjetivo: z.string().optional().or(z.literal("")),
    inversionEstimada: monto,
    beneficioAnualObjetivo: monto,
    moneda: z.string().trim().regex(/^[A-Z]{3}$/),
  })
  .superRefine((valor, contexto) => {
    if (valor.fechaInicio && valor.fechaObjetivo && valor.fechaObjetivo < valor.fechaInicio) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fechaObjetivo"],
        message: "La fecha objetivo no puede ser anterior al inicio",
      });
    }
  });

export const accionMejoraSchema = z.object({
  proyectoId: z.string().uuid(),
  iniciativaId: z.string().uuid(),
  titulo: z.string().trim().min(3, "La acción necesita un título"),
  descripcion: z.string().trim().optional().or(z.literal("")),
  responsable: z.string().trim().min(2, "Asigna un responsable"),
  fechaObjetivo: z.string().optional().or(z.literal("")),
});

export const estadoAccionMejoraSchema = z
  .object({
    proyectoId: z.string().uuid(),
    accionId: z.string().uuid(),
    estado: z.enum(["pendiente", "en_curso", "bloqueada", "completada", "cancelada"]),
    evidenciaResultado: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((valor, contexto) => {
    if (valor.estado === "completada" && (valor.evidenciaResultado?.length ?? 0) < 3) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidenciaResultado"],
        message: "Describe brevemente la evidencia del resultado",
      });
    }
  });

export const estadoIniciativaSchema = z.object({
  proyectoId: z.string().uuid(),
  iniciativaId: z.string().uuid(),
  estado: z.enum(["borrador", "priorizada", "en_ejecucion", "bloqueada", "completada", "descartada"]),
});

export const medicionImpactoSchema = z.object({
  proyectoId: z.string().uuid(),
  iniciativaId: z.string().uuid(),
  tipo: z.enum(["linea_base", "seguimiento", "cierre"]),
  fecha: z.string().min(1, "Selecciona una fecha"),
  beneficioAnualRealizado: monto,
  costoAcumulado: monto,
  valorIndicador: z.number().finite().nullable(),
  unidadIndicador: z.string().trim().optional().or(z.literal("")),
  fuenteDatos: z.string().trim().min(3, "La fuente de datos es obligatoria"),
  observaciones: z.string().trim().optional().or(z.literal("")),
  validadoCliente: z.boolean(),
});

export type CuantificacionImpactoInput = z.infer<typeof cuantificacionImpactoSchema>;
export type IniciativaMejoraInput = z.infer<typeof iniciativaMejoraSchema>;
export type AccionMejoraInput = z.infer<typeof accionMejoraSchema>;
export type EstadoAccionMejoraInput = z.infer<typeof estadoAccionMejoraSchema>;
export type EstadoIniciativaInput = z.infer<typeof estadoIniciativaSchema>;
export type MedicionImpactoInput = z.infer<typeof medicionImpactoSchema>;
