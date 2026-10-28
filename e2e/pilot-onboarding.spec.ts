import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("consultor inicia sesión y crea una empresa y un proyecto", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) throw new Error("Faltan credenciales sintéticas E2E.");

  const suffix = randomUUID().slice(0, 8);
  const empresa = `Empresa Piloto Sintética ${suffix}`;
  const proyecto = `Diagnóstico inicial ${suffix}`;

  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/lancelot$/);

  await page.goto("/clientes/nuevo");
  await page.getByLabel("Razón social *").fill(empresa);
  await page.getByLabel("Sector", { exact: true }).fill("Servicios empresariales");
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: empresa })).toBeVisible();

  await page.getByRole("link", { name: "Nuevo proyecto" }).click();
  await page.getByLabel("Nombre del proyecto *").fill(proyecto);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: proyecto })).toBeVisible();
  await expect(page.getByText(/contextualización/i)).toBeVisible();

  await page.goto("/lancelot");
  await expect(page.getByText("Panel de intervención")).toBeVisible();
  await expect(page.getByRole("heading", { name: empresa })).toBeVisible();
  await expect(page.getByText("Los 12 hitos del método")).toBeVisible();
  await expect(page.getByText("0 completados")).toBeVisible();
});
