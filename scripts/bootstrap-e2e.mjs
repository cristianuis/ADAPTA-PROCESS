import { randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;
const url = process.env.TEST_SUPABASE_URL;
const anonKey = process.env.TEST_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.TEST_SUPABASE_DATABASE_URL;
const githubEnv = process.env.GITHUB_ENV;

if (!url || !anonKey || !serviceRoleKey || !databaseUrl || !githubEnv) {
  throw new Error("E2E bootstrap solo permite aprovisionar usuarios en CI con TEST_SUPABASE_* locales.");
}

const api = new URL(url);
const database = new URL(databaseUrl);
if (
  api.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(api.hostname) ||
  api.port !== "54321" ||
  !["127.0.0.1", "localhost"].includes(database.hostname) ||
  database.port !== "54322"
) {
  throw new Error("E2E bootstrap solo admite Supabase efímero local en 127.0.0.1:54321/54322.");
}

const service = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const suffix = randomUUID();
const email = `nexus-e2e-${suffix}@example.test`;
const password = `Nexus-${randomUUID()}-Aa1!`;
const { data, error } = await service.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error || !data.user) throw error ?? new Error("No se creó el usuario sintético de E2E.");

const { data: consultor, error: consultorError } = await service
  .from("consultores")
  .insert({ user_id: data.user.id, email, nombre: "Consultor E2E" })
  .select("id")
  .single();
if (consultorError || !consultor) {
  await service.auth.admin.deleteUser(data.user.id);
  throw consultorError ?? new Error("No se creó el perfil consultor sintético.");
}

const db = new Client({ connectionString: databaseUrl });
try {
  await db.connect();
  await db.query(
    "insert into lancelot_private.administradores_plataforma (user_id) values ($1::uuid) on conflict (user_id) do nothing",
    [data.user.id],
  );
} catch (cause) {
  await service.from("consultores").delete().eq("id", consultor.id);
  await service.auth.admin.deleteUser(data.user.id);
  throw cause;
} finally {
  await db.end();
}

appendFileSync(githubEnv, `E2E_EMAIL=${email}\nE2E_PASSWORD=${password}\n`);
console.log("Usuario administrador sintético de E2E preparado en Supabase local.");
