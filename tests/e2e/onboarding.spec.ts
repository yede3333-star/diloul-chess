import { expect, test } from "@playwright/test";

// Guest mode only: CI has no Supabase keys, and the site must work fully without them.
test("first visit: onboarding → learn, progress kept on this device", async ({ page }) => {
  await page.goto("/ar/learn/basics");
  await page.waitForURL("**/ar/onboarding");

  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("radio", { name: /حوالي 1200/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();

  await page.locator("#lichess").fill("bad name!");
  await expect(page.locator("#lichess-err")).toBeVisible();
  await page.locator("#lichess").fill("yede_22");
  await page.getByRole("button", { name: "ابدأ التعلّم" }).click();

  await page.waitForURL("**/ar/learn/basics");
  await page.reload();
  await expect(page).toHaveURL(/\/ar\/learn\/basics$/);

  await page.goto("/ar/profile");
  await expect(page.getByText("حوالي 1200")).toBeVisible();
  await expect(page.getByText("Lichess: yede_22")).toBeVisible();
  // Without Supabase keys, sign-in is announced as not available yet.
  await expect(page.getByText("تسجيل الدخول غير مفعّل بعد", { exact: false }).first()).toBeVisible();
});

test("switching language during onboarding keeps the step and flips direction", async ({ page }) => {
  await page.goto("/ar/onboarding");
  await page.getByRole("radio", { name: "Français" }).click();
  await page.waitForURL("**/fr/onboarding?step=level");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: /Quel est ton niveau/ })).toBeVisible();
});
