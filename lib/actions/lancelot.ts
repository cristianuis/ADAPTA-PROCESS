"use server";

import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { respuestaLancelotSchema } from "@/lib/lancelot/types";
import type {
  ProyectoLancelot,
  SesionLancelot,
  SesionLancelotResumen,
  VueltaLancelot,
} from "@/lib/lancelot/types";

export async function listarProyectosLancelot(): Promise<ProyectoLancelot[]> {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("proyectos")
    .select("id, nombre, estado_comercial, fase_metodologica, clientes(razon_social)")
    .eq("consultor_id", consultor.id)
    .neq("estado_comercial", "cerrado")
    .order("created_at", { ascending: false });

  return (data ?? []).map((proyecto) => ({
    id: proyecto.id,
    nombre: proyecto.nombre,
    cliente: proyecto.clientes?.razon_social ?? "Cliente sin nombre",
    fase: proyecto.fase_metodologica,
    estado: proyecto.estado_comercial,
  }));
}

export async function listarSesionesLancelot(): Promise<SesionLancelotResumen[]> {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("lancelot_sesiones")
    .select("id, objetivo, foco, updated_at")
    .eq("consultor_id", consultor.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  return data ?? [];
}

export async function obtenerSesionLancelot(sesionId: string): Promise<SesionLancelot | null> {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { data: sesion } = await supabase
    .from("lancelot_sesiones")
    .select("*")
    .eq("id", sesionId)
    .eq("consultor_id", consultor.id)
    .maybeSingle();

  if (!sesion) return null;

  const { data: vueltas } = await supabase
    .from("lancelot_vueltas")
    .select("id, numero, retroalimentacion, salida, created_at")
    .eq("sesion_id", sesion.id)
    .order("numero", { ascending: true });

  const vueltasValidas: VueltaLancelot[] = [];
  for (const vuelta of vueltas ?? []) {
    const salida = respuestaLancelotSchema.safeParse(vuelta.salida);
    if (salida.success) vueltasValidas.push({ ...vuelta, salida: salida.data });
  }

  return { ...sesion, vueltas: vueltasValidas };
}

