import { expect, test } from "@playwright/test";

test("manifest and icons are served for installation", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  for (const icon of manifest.icons) {
    const img = await request.get(icon.src);
    expect(img.ok(), icon.src).toBe(true);
    expect(img.headers()["content-type"]).toContain("image/png");
  }
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
});

test("service worker is never cached by the browser", async ({ request }) => {
  const res = await request.get("/sw.js");
  expect(res.ok()).toBe(true);
  expect(res.headers()["cache-control"]).toContain("no-cache");
});

test("offline: visited pages still open, others show the offline notice", async ({ page, context }) => {
  await page.goto("/fr/onboarding");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first load happened before the worker controlled the page; load once more so it is cached.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.goto("/fr/onboarding");

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Choisis ta langue/ })).toBeVisible();

  await page.goto("/ar/puzzles").catch(() => undefined);
  await expect(page.getByRole("heading", { name: "لا يوجد اتصال بالإنترنت" })).toBeVisible();
  await context.setOffline(false);
});
