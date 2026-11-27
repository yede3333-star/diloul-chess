import { expect, test } from "@playwright/test";

test("/ redirects to the browser language (Arabic by default)", async ({ request }) => {
  const ar = await request.get("/", { maxRedirects: 0, headers: { "Accept-Language": "ar-MR,ar;q=0.9" } });
  expect(ar.status()).toBe(307);
  expect(ar.headers().location).toMatch(/\/ar$/);
  const fr = await request.get("/", { maxRedirects: 0, headers: { "Accept-Language": "fr-FR,fr;q=0.9" } });
  expect(fr.headers().location).toMatch(/\/fr$/);
  const other = await request.get("/", { maxRedirects: 0, headers: { "Accept-Language": "en-US" } });
  expect(other.headers().location).toMatch(/\/ar$/);
});

test("unknown pages show the localized not-found page", async ({ page }) => {
  const res = await page.goto("/fr/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
