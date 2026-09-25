import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { obtenerSupabaseDePruebas } from "./test-target";

const ejecutar = process.env.RUN_RLS_INTEGRATION === "1";
const describeRls = ejecutar ? describe : describe.skip;

describeRls("aislamiento de enlaces públicos por token (integración Supabase)", () => {
  let admin: SupabaseClient<Database>;
  let anon: SupabaseClient<Database>;
  let proyectoId: string;
  let clienteId: string;
  let consultorId: string;
  let usuarioId: string;
  let pemmIds: string[] = [];
  let entrevistaIds: string[] = [];

  const tokenPemmA = crypto.randomUUID();
  const tokenPemmB = crypto.randomUUID();
  const tokenIntakeA = crypto.randomUUID();
  const tokenIntakeB = crypto.randomUUID();

  beforeAll(async () => {
    const { url, anonKey, serviceRoleKey } = obtenerSupabaseDePruebas();

    admin = createClient<Database>(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    anon = createClient<Database>(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: usuario, error: usuarioError } = await admin.auth.admin.createUser({
      email: `token-rls-${crypto.randomUUID()}@example.com`,
      email_confirm: true,
    });
    if (usuarioError || !usuario.user) throw usuarioError ?? new Error("No se creó el usuario sintético.");
    usuarioId = usuario.user.id;

    const { data: consultor, error: consultorError } = await admin.from("consultores")
      .insert({ user_id: usuarioId, email: usuario.user.email!, nombre: "Consultor sintético RLS" })
      .select("id").single();
    if (consultorError || !consultor) throw consultorError ?? new Error("No se creó el consultor sintético.");
    consultorId = consultor.id;

    const { data: cliente, error: clienteError } = await admin.from("clientes")
      .insert({ consultor_id: consultorId, razon_social: "Empresa sintética RLS" })
      .select("id").single();
    if (clienteError || !cliente) throw clienteError ?? new Error("No se creó la empresa sintética.");
    clienteId = cliente.id;

    const { data: proyecto, error: proyectoError } = await admin.from("proyectos")
      .insert({ cliente_id: clienteId, consultor_id: consultorId, nombre: "Intervención sintética RLS" })
      .select("id").single();
    if (proyectoError || !proyecto) throw proyectoError ?? new Error("No se creó el proyecto sintético.");
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
    if (!admin) return;
    if (pemmIds.length > 0) await admin.from("pemm_evaluaciones").delete().in("id", pemmIds);
    if (entrevistaIds.length > 0) await admin.from("entrevistas").delete().in("id", entrevistaIds);
    if (proyectoId) await admin.from("proyectos").delete().eq("id", proyectoId);
    if (clienteId) await admin.from("clientes").delete().eq("id", clienteId);
    if (consultorId) await admin.from("consultores").delete().eq("id", consultorId);
    if (usuarioId) await admin.auth.admin.deleteUser(usuarioId);
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
