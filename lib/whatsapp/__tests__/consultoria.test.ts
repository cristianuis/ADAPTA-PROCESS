import { describe, expect, it } from "vitest";
import {
  crearEnlaceConsultoriaWhatsApp,
  crearMensajeConsultoria,
  normalizarNumeroWhatsApp,
} from "@/lib/whatsapp/consultoria";

const solicitud = {
  titulo: "Reducir reprocesos",
  descripcion: "Necesitamos ordenar el proceso comercial y medir sus errores.",
  nombre: "Laura Martínez",
  cargo: "Directora de operaciones",
  empresa: "Operaciones Aurora",
};

describe("solicitud de consultoría por WhatsApp", () => {
  it("normaliza el número y genera un enlace con todos los datos", () => {
    const enlace = crearEnlaceConsultoriaWhatsApp("+57 300 123 4567", solicitud);

    expect(enlace).toMatch(/^https:\/\/wa\.me\/573001234567\?text=/);
    const mensaje = decodeURIComponent(enlace.split("?text=")[1]);
    expect(mensaje).toContain("*Título:* Reducir reprocesos");
    expect(mensaje).toContain("*Nombre:* Laura Martínez");
    expect(mensaje).toContain("*Cargo:* Directora de operaciones");
    expect(mensaje).toContain("*Empresa:* Operaciones Aurora");
  });

  it("rechaza una configuración sin número válido", () => {
    expect(() => crearEnlaceConsultoriaWhatsApp("", solicitud)).toThrow(
      "Número de WhatsApp no configurado"
    );
  });

  it("conserva la descripción completa en el mensaje", () => {
    expect(crearMensajeConsultoria(solicitud)).toContain(solicitud.descripcion);
    expect(normalizarNumeroWhatsApp("+57 (300) 123-4567")).toBe("573001234567");
  });
});
