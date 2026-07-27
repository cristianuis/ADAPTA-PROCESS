import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const ejecutar = process.env.RUN_RLS_INTEGRATION === "1";
const describeRls = ejecutar ? describe : describe.skip;

describeRls("aislamiento de enlaces públicos por token (integración Supabase)", () => {
  let admin: SupabaseClient<Database>;
  let anon: SupabaseClient<Database>;
  let proyectoId: string;
  let pemmIds: string[] = [];
  let entrevistaIds: string[] = [];

  const tokenPemmA = crypto.randomUUID();
  const tokenPemmB = crypto.randomUUID();
  const tokenIntakeA = crypto.randomUUID();
  const tokenIntakeB = crypto.randomUUID();

  beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error("Faltan variables Supabase para ejecutar la prueba RLS de integración.");
    }

    admin = createClient<Database>(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    anon = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: proyecto, error: proyectoError } = await admin
      .from("proyectos")
      .select("id")
      .limit(1)
      .single();
    if (proyectoError || !proyecto) {
      throw new Error("La prueba RLS requiere al menos un proyecto de prueba.");
    }
    proyectoId = proyecto.id;

    const { data: pemm, error: pemmError } = await admin
      .from("pemm_evaluaciones")
      .insert([
        {
          proyecto_id: proyectoId,
          tipo: "empresa",
          fuente: "encuesta_publica",
          estado: "pendiente",
          token: tokenPemmA,
          respondiente_nivel: "direccion",
        },
        {
          proyecto_id: proyectoId,
          tipo: "empresa",
          fuente: "encuesta_publica",
          estado: "pendiente",
          token: tokenPemmB,
          respondiente_nivel: "operacion",
        },
      ])
      .select("id");
    if (pemmError || !pemm) throw new Error(`No se crearon fixtures PEMM: ${pemmError?.message}`);
    pemmIds = pemm.map((fila) => fila.id);

    const { data: entrevistas, error: entrevistasError } = await admin
      .from("entrevistas")
      .insert([
        {
          proyecto_id: proyectoId,
          origen: "autoservicio",
          estado: "pendiente",
          token: tokenIntakeA,
        },
        {
          proyecto_id: proyectoId,
          origen: "autoservicio",
          estado: "pendiente",
          token: tokenIntakeB,
        },
      ])
      .select("id");
    if (entrevistasError || !entrevistas) {
      throw new Error(`No se crearon fixtures de intake: ${entrevistasError?.message}`);
    }
    entrevistaIds = entrevistas.map((fila) => fila.id);
  });

  afterAll(async () => {
    if (pemmIds.length > 0) await admin.from("pemm_evaluaciones").delete().in("id", pemmIds);
    if (entrevistaIds.length > 0) await admin.from("entrevistas").delete().in("id", entrevistaIds);
  });

  it("el token PEMM A no devuelve la fila B y anon no puede enumerar la tabla", async () => {
    const lecturaDirecta = await anon.from("pemm_evaluaciones").select("id, token");
    expect(lecturaDirecta.error).not.toBeNull();

    const { data, error } = await anon.rpc("obtener_pemm_publico", { p_token: tokenPemmA });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.token).toBe(tokenPemmA);
    expect(data?.some((fila) => fila.token === tokenPemmB)).toBe(false);
  });

  it("el token de intake A no devuelve la fila B y anon no puede enumerar la tabla", async () => {
    const lecturaDirecta = await anon.from("entrevistas").select("id, token");
    expect(lecturaDirecta.error).not.toBeNull();

    const { data, error } = await anon.rpc("obtener_intake_publico", { p_token: tokenIntakeA });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.token).toBe(tokenIntakeA);
    expect(data?.some((fila) => fila.token === tokenIntakeB)).toBe(false);
  });
});
