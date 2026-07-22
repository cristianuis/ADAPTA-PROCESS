"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConsultor } from "@/lib/actions/consultores";
import { clienteSchema, type ClienteInput } from "@/lib/validations/cliente.schema";

export async function listarClientes(query?: string) {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  let builder = supabase
    .from("clientes")
    .select("*")
    .eq("consultor_id", consultor.id)
    .order("created_at", { ascending: false });

  if (query) {
    builder = builder.ilike("razon_social", `%${query}%`);
  }

  const { data, error } = await builder;
  if (error) return [];
  return data;
}

export async function obtenerCliente(clienteId: string) {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .eq("consultor_id", consultor.id)
    .maybeSingle();

  return data;
}

export async function listarProyectosDeCliente(clienteId: string) {
  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("proyectos")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("consultor_id", consultor.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

function toRow(input: ClienteInput) {
  return {
    razon_social: input.razonSocial,
    nit: input.nit || null,
    sector: input.sector || null,
    subsector: input.subsector || null,
    num_empleados: input.numEmpleados ?? null,
    facturacion_anual: input.facturacionAnual ?? null,
    ciudad: input.ciudad || null,
    contacto_nombre: input.contactoNombre || null,
    contacto_cargo: input.contactoCargo || null,
    contacto_email: input.contactoEmail || null,
    contacto_telefono: input.contactoTelefono || null,
    notas: input.notas || null,
  };
}

export async function crearCliente(input: ClienteInput) {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...toRow(parsed.data), consultor_id: consultor.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No se pudo crear el cliente. Intenta de nuevo." };
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function actualizarCliente(clienteId: string, input: ClienteInput) {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { consultor } = await requireConsultor();
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update(toRow(parsed.data))
    .eq("id", clienteId)
    .eq("consultor_id", consultor.id);

  if (error) {
    return { error: "No se pudo actualizar el cliente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
}
