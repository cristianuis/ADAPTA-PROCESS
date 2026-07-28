"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const leadSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  empresa: z.string().trim().min(2).max(140),
  consentimiento: z.literal(true),
  sitioWeb: z.string().max(0).optional().or(z.literal("")),
});

const respuestasSchema = z
  .array(z.number().int().min(0).max(2))
  .length(5);

export async function iniciarDemoDiagnostico(input: {
  nombre: string;
  email: string;
  empresa: string;
  consentimiento: boolean;
  sitioWeb?: string;
}) {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Revisa tu nombre, correo, empresa y autorización de contacto.",
      token: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("iniciar_demo_diagnostico", {
    p_nombre: parsed.data.nombre,
    p_email: parsed.data.email,
    p_empresa: parsed.data.empresa,
    p_consentimiento: parsed.data.consentimiento,
    p_sitio_web: parsed.data.sitioWeb ?? "",
  });

  if (error || !data) {
    return {
      error: "No pudimos iniciar el diagnóstico. Intenta nuevamente.",
      token: null,
    };
  }

  return { error: null, token: data };
}

export async function completarDemoDiagnostico(input: {
  token: string;
  respuestas: number[];
}) {
  const token = z.string().uuid().safeParse(input.token);
  const respuestas = respuestasSchema.safeParse(input.respuestas);

  if (!token.success || !respuestas.success) {
    return { error: "Completa todas las preguntas.", resultado: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("completar_demo_diagnostico", {
    p_token: token.data,
    p_respuestas: respuestas.data,
  });

  const resultado = data?.[0];
  if (error || !resultado) {
    return {
      error: "No pudimos calcular el resultado. Intenta nuevamente.",
      resultado: null,
    };
  }

  return {
    error: null,
    resultado: {
      perfil: resultado.p_perfil,
      puntaje: resultado.p_puntaje,
    },
  };
}
