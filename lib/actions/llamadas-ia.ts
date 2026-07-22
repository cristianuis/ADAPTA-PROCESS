import { createClient } from "@/lib/supabase/server";
import type { EndpointIA } from "@/lib/supabase/types";

interface RegistrarLlamadaIAInput {
  consultorId: string;
  proyectoId: string | null;
  endpoint: EndpointIA;
  modelo: string;
  tokensEntrada: number | null;
  tokensSalida: number | null;
}

/**
 * Registra una llamada a Anthropic para instrumentación de costo (auditoría Bloque 3).
 * Nunca debe romper la respuesta al usuario — si el insert falla, se registra en logs
 * del servidor y se sigue de largo. No usar `await` en el caller si se quiere que esto
 * corra sin bloquear la respuesta; aquí se expone como async para que el caller decida.
 */
export async function registrarLlamadaIA(input: RegistrarLlamadaIAInput) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("llamadas_ia").insert({
      consultor_id: input.consultorId,
      proyecto_id: input.proyectoId,
      endpoint: input.endpoint,
      modelo: input.modelo,
      tokens_entrada: input.tokensEntrada,
      tokens_salida: input.tokensSalida,
    });
    if (error) {
      console.error("[llamadas_ia] no se pudo registrar la llamada (no bloqueante):", error);
    }
  } catch (e) {
    console.error("[llamadas_ia] excepción registrando la llamada (no bloqueante):", e);
  }
}
