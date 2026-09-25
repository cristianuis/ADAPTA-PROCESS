import { describe, expect, it } from "vitest";
import { obtenerSupabaseDePruebas } from "./test-target";

const base = {
  TEST_SUPABASE_ANON_KEY: "test-anon",
  TEST_SUPABASE_SERVICE_ROLE_KEY: "test-service",
};

describe("guardia de destino de integración", () => {
  it("acepta únicamente el proyecto cloud identificado", () => {
    const env = { ...base, TEST_SUPABASE_URL: "https://stagingref.supabase.co", TEST_SUPABASE_PROJECT_REF: "stagingref" };
    expect(obtenerSupabaseDePruebas(env).url).toBe(env.TEST_SUPABASE_URL);
  });

  it("rechaza producción aunque se declare como test", () => {
    expect(() => obtenerSupabaseDePruebas({ ...base, TEST_SUPABASE_URL: "https://yemhtfcytrjimsdehlbf.supabase.co", TEST_SUPABASE_PROJECT_REF: "yemhtfcytrjimsdehlbf" })).toThrow(/producción/);
  });

  it("rechaza claves de aplicación heredadas sin variables test", () => {
    expect(() => obtenerSupabaseDePruebas({ NEXT_PUBLIC_SUPABASE_URL: "https://stagingref.supabase.co" })).toThrow(/TEST_SUPABASE/);
  });

  it("rechaza un destino distinto de la referencia declarada", () => {
    expect(() => obtenerSupabaseDePruebas({ ...base, TEST_SUPABASE_URL: "https://otro.supabase.co", TEST_SUPABASE_PROJECT_REF: "stagingref" })).toThrow(/exacto/);
  });

  it("acepta Supabase local en el puerto estándar", () => {
    expect(obtenerSupabaseDePruebas({ ...base, TEST_SUPABASE_URL: "http://127.0.0.1:54321" }).url).toBe("http://127.0.0.1:54321");
  });
});
