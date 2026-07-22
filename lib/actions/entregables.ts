"use server";

import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";

export async function listarEntregables(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("entregables")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
