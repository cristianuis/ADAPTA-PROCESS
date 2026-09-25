"use server";

import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";

export async function listarEntregables(proyectoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entregables")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("No se pudieron consultar los entregables.");
  return data ?? [];
}
