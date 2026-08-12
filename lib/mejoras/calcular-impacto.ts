export interface DatosCuantificacion {
  valorUnitario: number;
  volumenPeriodo: number;
  periodosAnio: number;
  porcentajeCapturable: number;
}

export function calcularImpactoAnual(datos: DatosCuantificacion) {
  return Math.round(
    datos.valorUnitario *
      datos.volumenPeriodo *
      datos.periodosAnio *
      (datos.porcentajeCapturable / 100) *
      100
  ) / 100;
}

export function calcularCasoNegocio(inversion: number, beneficioAnual: number) {
  return {
    roi: inversion > 0 ? Math.round((((beneficioAnual - inversion) / inversion) * 100) * 100) / 100 : null,
    paybackMeses: beneficioAnual > 0 ? Math.round((inversion / (beneficioAnual / 12)) * 100) / 100 : null,
  };
}

export function calcularAvanceBeneficio(realizado: number, objetivo: number) {
  if (objetivo <= 0) return 0;
  return Math.max(0, Math.round((realizado / objetivo) * 100));
}
