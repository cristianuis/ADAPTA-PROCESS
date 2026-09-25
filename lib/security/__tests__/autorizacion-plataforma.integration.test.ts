import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { obtenerSupabaseDePruebas } from "./test-target";

const ejecutar = process.env.RUN_RLS_INTEGRATION === "1";
const describeRls = ejecutar ? describe : describe.skip;

describeRls("autorización inicial de Lancelot (integración Supabase)", () => {
  let service: SupabaseClient;
  let usuarioA: SupabaseClient;
  let usuarioB: SupabaseClient;
  const password = `Lancelot-${crypto.randomUUID()}-Aa1!`;
  const sufijo = crypto.randomUUID();
  const idsUsuario: string[] = [];
  const idsCliente: string[] = [];
  const idsProyecto: string[] = [];
  let idIniciativaA = "";
  let idConsultorA = "";
  let idConsultorB = "";
  let idUsuarioSinPerfil = "";

  async function crearUsuario(etiqueta: string) {
    const { data, error } = await service.auth.admin.createUser({
      email: `lancelot-rls-${etiqueta}-${sufijo}@example.com`,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("No se creó el usuario de prueba.");
    idsUsuario.push(data.user.id);
    return data.user;
  }

  beforeAll(async () => {
    const { url, anonKey, serviceRoleKey } = obtenerSupabaseDePruebas();

    service = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonA = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonB = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [a, b, sinPerfil] = await Promise.all([
      crearUsuario("a"),
      crearUsuario("b"),
      crearUsuario("sin-perfil"),
    ]);
    idUsuarioSinPerfil = sinPerfil.id;

    const [{ data: consultorA, error: errorA }, { data: consultorB, error: errorB }] = await Promise.all([
      service.from("consultores").insert({ user_id: a.id, email: a.email!, nombre: "Prueba A" }).select("id").single(),
      service.from("consultores").insert({ user_id: b.id, email: b.email!, nombre: "Prueba B" }).select("id").single(),
    ]);
    if (errorA || errorB || !consultorA || !consultorB) {
      throw errorA ?? errorB ?? new Error("No se crearon los consultores de prueba.");
    }
    idConsultorA = consultorA.id;
    idConsultorB = consultorB.id;

    const [{ data: clienteA, error: clienteErrorA }, { data: clienteB, error: clienteErrorB }] = await Promise.all([
      service.from("clientes").insert({ consultor_id: idConsultorA, razon_social: `RLS A ${sufijo}` }).select("id").single(),
      service.from("clientes").insert({ consultor_id: idConsultorB, razon_social: `RLS B ${sufijo}` }).select("id").single(),
    ]);
    if (clienteErrorA || clienteErrorB || !clienteA || !clienteB) {
      throw clienteErrorA ?? clienteErrorB ?? new Error("No se crearon los clientes de prueba.");
    }
    idsCliente.push(clienteA.id, clienteB.id);

    const [{ data: proyectoA, error: proyectoErrorA }, { data: proyectoB, error: proyectoErrorB }] = await Promise.all([
      service.from("proyectos").insert({ consultor_id: idConsultorA, cliente_id: clienteA.id, nombre: `RLS A ${sufijo}` }).select("id").single(),
      service.from("proyectos").insert({ consultor_id: idConsultorB, cliente_id: clienteB.id, nombre: `RLS B ${sufijo}` }).select("id").single(),
    ]);
    if (proyectoErrorA || proyectoErrorB || !proyectoA || !proyectoB) {
      throw proyectoErrorA ?? proyectoErrorB ?? new Error("No se crearon los proyectos de prueba.");
    }
    idsProyecto.push(proyectoA.id, proyectoB.id);

    const { data: iniciativa, error: iniciativaError } = await service.from("iniciativas_mejora").insert({
      proyecto_id: proyectoA.id,
      titulo: `Iniciativa RLS ${sufijo}`,
      hipotesis: "Una intervención de prueba valida el cierre con evidencia.",
      resultado_esperado: "Probar las reglas de cierre",
      criterio_exito: "El cierre sin evidencia es rechazado",
    }).select("id").single();
    if (iniciativaError || !iniciativa) throw iniciativaError ?? new Error("No se creó la iniciativa de prueba.");
    idIniciativaA = iniciativa.id;

    const { error: loginErrorA } = await anonA.auth.signInWithPassword({ email: a.email!, password });
    if (loginErrorA) throw loginErrorA;
    const { error: loginErrorB } = await anonB.auth.signInWithPassword({ email: b.email!, password });
    if (loginErrorB) throw loginErrorB;
    usuarioA = anonA;
    usuarioB = anonB;

    // El tercer usuario existe en Auth pero no tiene permiso de consultor.
    expect(sinPerfil.id).toBeTruthy();
  });

  afterAll(async () => {
    if (!service) return;
    if (idIniciativaA) await service.from("iniciativas_mejora").delete().eq("id", idIniciativaA);
    if (idsProyecto.length) await service.from("proyectos").delete().in("id", idsProyecto);
    if (idsCliente.length) await service.from("clientes").delete().in("id", idsCliente);
    const consultorIds = [idConsultorA, idConsultorB].filter(Boolean);
    if (consultorIds.length) await service.from("consultores").delete().in("id", consultorIds);
    for (const id of idsUsuario) await service.auth.admin.deleteUser(id);
  });

  it("permite leer el proyecto propio, no el ajeno, y rechaza RPCs privilegiados", async () => {
    const propios = await usuarioA.from("proyectos").select("id").in("id", idsProyecto);
    expect(propios.error).toBeNull();
    expect(propios.data?.map((fila) => fila.id)).toEqual([idsProyecto[0]]);

    const faseAjena = await usuarioA.rpc("recalcular_fase_metodologica", {
      p_proyecto_id: idsProyecto[1],
    });
    expect(faseAjena.error).not.toBeNull();

    const prospectos = await usuarioA.rpc("listar_prospectos_demo");
    expect(prospectos.error).not.toBeNull();

    const fasePropia = await usuarioB.rpc("recalcular_fase_metodologica", {
      p_proyecto_id: idsProyecto[1],
    });
    expect(fasePropia.error).toBeNull();
  });

  it("aísla clientes, proyectos e iniciativas y prohíbe cruzar cliente/consultor", async () => {
    const [clientesA, proyectosB, iniciativasB] = await Promise.all([
      usuarioA.from("clientes").select("id").in("id", idsCliente),
      usuarioB.from("proyectos").select("id").in("id", idsProyecto),
      usuarioB.from("iniciativas_mejora").select("id").eq("id", idIniciativaA),
    ]);
    expect(clientesA.error).toBeNull();
    expect(clientesA.data?.map((fila) => fila.id)).toEqual([idsCliente[0]]);
    expect(proyectosB.error).toBeNull();
    expect(proyectosB.data?.map((fila) => fila.id)).toEqual([idsProyecto[1]]);
    expect(iniciativasB.error).toBeNull();
    expect(iniciativasB.data).toEqual([]);

    const cruce = await usuarioA.from("proyectos").insert({
      consultor_id: idConsultorA,
      cliente_id: idsCliente[1],
      nombre: `Cruce prohibido ${sufijo}`,
    });
    expect(cruce.error).not.toBeNull();

    const reasignacion = await usuarioA.from("proyectos")
      .update({ cliente_id: idsCliente[1] })
      .eq("id", idsProyecto[0]);
    expect(reasignacion.error).not.toBeNull();

    const { data: intacto, error } = await service.from("proyectos")
      .select("cliente_id")
      .eq("id", idsProyecto[0])
      .single();
    expect(error).toBeNull();
    expect(intacto?.cliente_id).toBe(idsCliente[0]);
  });

  it("protege los binarios de informes en Storage frente a otro consultor", async () => {
    const ruta = `${idConsultorA}/${idsProyecto[0]}/${crypto.randomUUID()}.docx`;
    const contenido = new Uint8Array([80, 75, 3, 4, 0, 0, 0, 0]);
    const opciones = {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false,
    };
    const subida = await usuarioA.storage.from("nexus-informes").upload(ruta, contenido, opciones);
    expect(subida.error).toBeNull();
    try {
      const propio = await usuarioA.storage.from("nexus-informes").download(ruta);
      expect(propio.error).toBeNull();
      expect(propio.data).not.toBeNull();

      const ajeno = await usuarioB.storage.from("nexus-informes").download(ruta);
      expect(ajeno.error).not.toBeNull();
      expect(ajeno.data).toBeNull();

      const escrituraAjena = await usuarioB.storage.from("nexus-informes")
        .upload(`${idConsultorA}/${idsProyecto[0]}/${crypto.randomUUID()}.docx`, contenido, opciones);
      expect(escrituraAjena.error).not.toBeNull();
    } finally {
      const retirada = await usuarioA.storage.from("nexus-informes").remove([ruta]);
      expect(retirada.error).toBeNull();
    }
  });

  it("no permite a un usuario crear perfiles de consultor para otra cuenta", async () => {
    const insercion = await usuarioA.from("consultores").insert({
      user_id: idUsuarioSinPerfil,
      email: `lancelot-rls-sin-perfil-${sufijo}@example.com`,
      nombre: "Intento de autoaprovisionamiento",
    });
    expect(insercion.error).not.toBeNull();
  });

  it("no permite cerrar una iniciativa sin acciones con evidencia y medición de cierre", async () => {
    const cierre = await usuarioA.from("iniciativas_mejora")
      .update({ estado: "completada" })
      .eq("id", idIniciativaA)
      .select("id")
      .maybeSingle();
    expect(cierre.error).not.toBeNull();
  });
});
