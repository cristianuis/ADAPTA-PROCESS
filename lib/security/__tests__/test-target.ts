/** Las pruebas de integración pueden crear usuarios y borrar fixtures.
 * Nunca heredan las credenciales de la aplicación. */
export function obtenerSupabaseDePruebas(env: NodeJS.ProcessEnv = process.env) {
  const url = env.TEST_SUPABASE_URL;
  const anonKey = env.TEST_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
  const expectedRef = env.TEST_SUPABASE_PROJECT_REF;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Faltan TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY o TEST_SUPABASE_SERVICE_ROLE_KEY.");
  }

  const parsed = new URL(url);
  const local = parsed.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsed.hostname) && parsed.port === "54321";
  const cloudRef = /^([a-z0-9]+)\.supabase\.co$/.exec(parsed.hostname)?.[1];
  const cloud = parsed.protocol === "https:" && !!cloudRef && !!expectedRef && cloudRef === expectedRef;

  if ((!local && !cloud) || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("TEST_SUPABASE_URL debe apuntar a Supabase local :54321 o al proyecto cloud TEST_SUPABASE_PROJECT_REF exacto.");
  }
  if (
    cloudRef === "yemhtfcytrjimsdehlbf" ||
    (!local && url.replace(/\/$/, "") === env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ""))
  ) {
    throw new Error("Las pruebas de integración no pueden ejecutarse contra producción.");
  }

  return { url, anonKey, serviceRoleKey };
}
