"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { benchmarkSchema, type BenchmarkInput } from "@/lib/validations/plantilla.schema";

export async function listarBenchmarks() {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { data } = await supabase
    .from("benchmarks")
    .select("*")
    .eq("consultor_id", consultor.id)
    .order("sector", { ascending: true });
  return data ?? [];
}

/** Benchmark sectorial: cifras agregadas y anonimizadas, nunca datos identificables de un cliente. */
export async function crearBenchmark(input: BenchmarkInput) {
  const parsed = benchmarkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { consultor } = await requireConsultor();
  const supabase = await createClient();
  const { sector, indicador, valorP25, valorMediana, valorP75, numObservaciones } = parsed.data;

  const { error } = await supabase.from("benchmarks").insert({
    consultor_id: consultor.id,
    sector,
    indicador,
    valor_p25: valorP25 ?? null,
    valor_mediana: valorMediana ?? null,
    valor_p75: valorP75 ?? null,
    num_observaciones: numObservaciones,
  });

  if (error) return { error: "No se pudo guardar el benchmark." };

  revalidatePath("/biblioteca");
  return { error: null };
}
