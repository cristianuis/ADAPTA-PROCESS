"use client";

import { useState } from "react";
import { ArrowUpRight, MessageCircle, ShieldCheck } from "lucide-react";
import {
  crearEnlaceConsultoriaWhatsApp,
  type SolicitudConsultoria,
} from "@/lib/whatsapp/consultoria";

interface ConsultoriaFormProps {
  whatsappNumber: string;
  initialValues?: Partial<Pick<SolicitudConsultoria, "titulo" | "descripcion" | "empresa">>;
}

const EMPTY_FORM: SolicitudConsultoria = {
  titulo: "",
  descripcion: "",
  nombre: "",
  cargo: "",
  empresa: "",
};

export function ConsultoriaForm({
  whatsappNumber,
  initialValues,
}: ConsultoriaFormProps) {
  const [datos, setDatos] = useState<SolicitudConsultoria>({
    ...EMPTY_FORM,
    ...initialValues,
  });
  const disponible = whatsappNumber.replace(/\D/g, "").length >= 8;

  function actualizar(campo: keyof SolicitudConsultoria, valor: string) {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
  }

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!disponible) return;

    const enlace = crearEnlaceConsultoriaWhatsApp(whatsappNumber, datos);
    const nuevaVentana = window.open(enlace, "_blank", "noopener,noreferrer");
    if (!nuevaVentana) window.location.assign(enlace);
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-[2rem] border border-[#163f8c]/15 bg-white p-6 shadow-2xl shadow-[#163f8c]/10 sm:p-9"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#315da8]">
            Cuéntame el reto
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0a1c40]">
            Inicia la conversación.
          </h2>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#eef3fb] text-[#163f8c]">
          <MessageCircle className="size-5" />
        </span>
      </div>

      <div className="mt-8 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
          Título del interés
          <input
            required
            minLength={4}
            maxLength={120}
            value={datos.titulo}
            onChange={(event) => actualizar("titulo", event.target.value)}
            placeholder="Ej. Reducir reprocesos en la operación"
            className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none placeholder:text-[#8a96a8] focus:border-[#163f8c]"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
          Descripción
          <textarea
            required
            minLength={12}
            maxLength={1000}
            rows={5}
            value={datos.descripcion}
            onChange={(event) => actualizar("descripcion", event.target.value)}
            placeholder="¿Qué está ocurriendo, qué impacto tiene y qué te gustaría mejorar?"
            className="resize-y rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 py-3 font-normal leading-6 text-[#0a1c40] outline-none placeholder:text-[#8a96a8] focus:border-[#163f8c]"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
            Nombre
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={datos.nombre}
              onChange={(event) => actualizar("nombre", event.target.value)}
              className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none focus:border-[#163f8c]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
            Cargo
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="organization-title"
              value={datos.cargo}
              onChange={(event) => actualizar("cargo", event.target.value)}
              className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none focus:border-[#163f8c]"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[#163f8c]">
          Empresa
          <input
            required
            minLength={2}
            maxLength={140}
            autoComplete="organization"
            value={datos.empresa}
            onChange={(event) => actualizar("empresa", event.target.value)}
            className="min-h-12 rounded-xl border border-[#163f8c]/20 bg-[#fbfaf7] px-4 font-normal text-[#0a1c40] outline-none focus:border-[#163f8c]"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={!disponible}
        className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#163f8c] px-6 text-sm font-semibold text-white hover:bg-[#2456b3] disabled:cursor-not-allowed disabled:bg-[#8d9bb1]"
      >
        <MessageCircle className="size-5" />
        {disponible
          ? "Enviar interés por WhatsApp"
          : "WhatsApp pendiente de configuración"}
        <ArrowUpRight className="size-4" />
      </button>

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#66758b]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#315da8]" />
        El botón prepara el mensaje con estos datos y abre WhatsApp. No crea una
        cuenta ni concede acceso a ADAPTA OS.
      </p>
    </form>
  );
}
