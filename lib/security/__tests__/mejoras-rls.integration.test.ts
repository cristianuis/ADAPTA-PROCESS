import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const ejecutar = process.env.RUN_RLS_INTEGRATION === "1";
const describeRls = ejecutar ? describe : describe.skip;

describeRls("plan de mejora privado (integración Supabase)", () => {
  let anon: SupabaseClient<Database>;

  beforeAll(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) throw new Error("Faltan variables Supabase para ejecutar la prueba RLS.");
    anon = createClient<Database>(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  });

  it.each([
    "cuantificaciones_impacto",
    "iniciativas_mejora",
    "iniciativa_hallazgos",
    "acciones_mejora",
    "mediciones_impacto",
  ] as const)("anon no puede enumerar %s", async (tabla) => {
    const lectura = await anon.from(tabla).select("*");
    expect(lectura.error).not.toBeNull();
    expect(lectura.data).toBeNull();
  });
});
