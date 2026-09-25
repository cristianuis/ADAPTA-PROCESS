export interface CoberturaInforme360 {
  entrevistas: number;
  evaluacionesPemmRespondidas: number;
  hallazgosRevisados: number;
  procesosConActividades: number;
  disenosTobeValidados: number;
  indicadores: number;
  iniciativasConAcciones: number;
}

export const REQUISITOS_INFORME_360: { clave: keyof CoberturaInforme360; descripcion: string }[] = [
  { clave: "entrevistas", descripcion: "Al menos una entrevista registrada" },
  { clave: "evaluacionesPemmRespondidas", descripcion: "Al menos una evaluación PEMM respondida" },
  { clave: "hallazgosRevisados", descripcion: "Al menos un hallazgo con evidencia revisada" },
  { clave: "procesosConActividades", descripcion: "Al menos un proceso AS-IS con actividades" },
  { clave: "disenosTobeValidados", descripcion: "Al menos un diseño TO-BE validado" },
  { clave: "indicadores", descripcion: "Al menos un indicador definido" },
  { clave: "iniciativasConAcciones", descripcion: "Al menos una iniciativa con acciones" },
];

export function evaluarPreparacionInforme360(cobertura: CoberturaInforme360) {
  const faltantes = REQUISITOS_INFORME_360.filter(({ clave }) => cobertura[clave] < 1);
  return { listo: faltantes.length === 0, faltantes };
}
