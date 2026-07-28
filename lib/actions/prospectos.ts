"use server";

import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";

export interface ProspectoDemo {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  estado: string;
  puntaje: number | null;
  perfil: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function listarProspectosDemo(): Promise<ProspectoDemo[]> {
  await requireConsultor();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listar_prospectos_demo");

  if (error) return [];
  return data;
}
