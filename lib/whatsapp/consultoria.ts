export interface SolicitudConsultoria {
  titulo: string;
  descripcion: string;
  nombre: string;
  cargo: string;
  empresa: string;
}

export function normalizarNumeroWhatsApp(numero: string): string {
  return numero.replace(/\D/g, "");
}

export function crearMensajeConsultoria(datos: SolicitudConsultoria): string {
  return [
    "*Solicitud de consultoría especializada — Lancelot*",
    "",
    `*Título:* ${datos.titulo.trim()}`,
    `*Descripción:* ${datos.descripcion.trim()}`,
    "",
    `*Nombre:* ${datos.nombre.trim()}`,
    `*Cargo:* ${datos.cargo.trim()}`,
    `*Empresa:* ${datos.empresa.trim()}`,
    "",
    "Quisiera conversar sobre el diagnóstico y los siguientes pasos.",
  ].join("\n");
}

export function crearEnlaceConsultoriaWhatsApp(
  numero: string,
  datos: SolicitudConsultoria
): string {
  const numeroNormalizado = normalizarNumeroWhatsApp(numero);
  if (numeroNormalizado.length < 8 || numeroNormalizado.length > 15) {
    throw new Error("Número de WhatsApp no configurado");
  }

  return `https://wa.me/${numeroNormalizado}?text=${encodeURIComponent(
    crearMensajeConsultoria(datos)
  )}`;
}
