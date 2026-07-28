import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ejecutar = process.env.RUN_RLS_INTEGRATION === "1";
const describeRls = ejecutar ? describe : describe.skip;

describeRls("demo pública de diagnóstico (integración Supabase)", () => {
  let admin: SupabaseClient;
  let anon: SupabaseClient;
  const email = `demo-test-${crypto.randomUUID()}@example.com`;

  beforeAll(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error("Faltan variables Supabase para ejecutar la prueba de integración.");
    }

    admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    await admin.from("demo_diagnosticos").delete().eq("email", email);
  });

  it("captura el prospecto y devuelve solo el resultado de su token", async () => {
    const inicio = await anon.rpc("iniciar_demo_diagnostico", {
      p_nombre: "Prueba Automatizada",
      p_email: email,
      p_empresa: "Empresa de prueba",
      p_consentimiento: true,
      p_sitio_web: "",
    });

    expect(inicio.error).toBeNull();
    expect(inicio.data).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    const resultado = await anon.rpc("completar_demo_diagnostico", {
      p_token: inicio.data,
      p_respuestas: [0, 1, 0, 1, 0],
    });

    expect(resultado.error).toBeNull();
    expect(resultado.data).toEqual([
      { p_perfil: "dependencia_operativa", p_puntaje: 2 },
    ]);
  });

  it("anon no puede leer prospectos ni enumerar la tabla", async () => {
    const lectura = await anon.from("demo_diagnosticos").select("*");
    expect(lectura.error).not.toBeNull();

    const listado = await anon.rpc("listar_prospectos_demo");
    expect(listado.error).not.toBeNull();
  });
});
