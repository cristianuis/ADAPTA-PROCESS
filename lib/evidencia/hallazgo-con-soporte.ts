/** La etiqueta de revisión por sí sola no demuestra que exista una fuente localizable. */
export function hallazgoConSoporteRevisado(hallazgo: {
  estado_evidencia: string | null;
  cita_soporte: string | null;
  fuente: string | null;
  fuente_id: string | null;
}): boolean {
  if (!hallazgo.cita_soporte || hallazgo.cita_soporte.trim().length < 10) return false;
  if (hallazgo.estado_evidencia === "cita_verificada") {
    return hallazgo.fuente === "entrevista" && !!hallazgo.fuente_id;
  }
  return hallazgo.estado_evidencia === "validado_consultor";
}
