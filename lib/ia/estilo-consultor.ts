/**
 * Bloque 1.3 — mecanismo (inactivo por defecto) para inyectar la voz propia del consultor
 * en los prompts de redacción. Mientras `consultores.ejemplos_estilo` esté vacío, esta
 * función retorna null y el prompt se comporta exactamente igual que hoy. Solo cuando el
 * consultor pega su propio contenido en /perfil se activa el bloque adicional.
 */
export function construirBloqueEstiloConsultor(ejemplosEstilo: string | null | undefined): string | null {
  const texto = ejemplosEstilo?.trim();
  if (!texto) return null;

  return `REFERENCIA DE VOZ DEL CONSULTOR — imita este tono y forma de escribir, no copies el contenido literal:
${texto}`;
}
