function normalizarCita(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim();
}

/** Comprueba que la cita propuesta exista literalmente (ignorando mayúsculas,
 * tildes y espacios repetidos) en el texto fuente antes de llamarla verificable. */
export function citaExisteEnFuente(fuente: string | null | undefined, cita: string): boolean {
  if (!fuente || cita.trim().length < 10) return false;
  return normalizarCita(fuente).includes(normalizarCita(cita));
}
