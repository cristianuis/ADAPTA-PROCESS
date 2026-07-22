"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { sipocSchema, type SipocInput } from "@/lib/validations/sipoc.schema";

export async function obtenerSipoc(procesoId: string) {
  await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase.from("sipoc").select("*").eq("proceso_id", procesoId).maybeSingle();
  return data;
}

export async function guardarSipoc(input: SipocInput) {
  const parsed = sipocSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await requireConsultor();
  const supabase = await createClient();
  const { procesoId, proveedores, entradas, pasos, salidas, clientes } = parsed.data;

  const { data: proceso } = await supabase.from("procesos").select("proyecto_id").eq("id", procesoId).maybeSingle();

  const { error } = await supabase
    .from("sipoc")
    .upsert({ proceso_id: procesoId, proveedores, entradas, pasos, salidas, clientes }, { onConflict: "proceso_id" });

  if (error) return { error: "No se pudo guardar el SIPOC." };

  if (proceso) revalidatePath(`/proyectos/${proceso.proyecto_id}/procesos/${procesoId}`);
  return { error: null };
}
