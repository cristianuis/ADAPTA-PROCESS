"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { consultorSchema, type ConsultorInput } from "@/lib/validations/consultor.schema";

/** Devuelve el perfil de consultor del usuario autenticado, o null si aún no lo completó. */
export async function getConsultorActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: consultor } = await supabase
    .from("consultores")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { consultor, user };
}

/** Igual que getConsultorActual, pero redirige a /perfil si el perfil no existe. Usar en páginas que dependen de consultor_id. */
export async function requireConsultor() {
  const { consultor, user } = await getConsultorActual();
  if (!consultor) redirect("/perfil");
  return { consultor, user };
}

export async function guardarPerfilConsultor(input: ConsultorInput) {
  const parsed = consultorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { nombre, empresa, colorPrimario, colorSecundario, tarifaHoraObjetivo, ejemplosEstilo } = parsed.data;

  const { error } = await supabase.from("consultores").upsert(
    {
      user_id: user.id,
      email: user.email ?? "",
      nombre,
      empresa: empresa || null,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
      tarifa_hora_objetivo: tarifaHoraObjetivo ?? null,
      ejemplos_estilo: ejemplosEstilo || null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: "No se pudo guardar el perfil. Intenta de nuevo." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
