import { expect, test, type Page } from "@playwright/test";

/** Taps a square of the lesson board (White at the bottom). */
async function tap(page: Page, square: string) {
  const box = (await page.locator(".lesson .dboard").boundingBox())!;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  await page.mouse.click(box.x + ((file + 0.5) * box.width) / 8, box.y + ((7 - rank + 0.5) * box.height) / 8);
}

async function move(page: Page, from: string, to: string) {
  await tap(page, from);
  await tap(page, to);
}

test("guest learns the first London lesson, then its drill opens", async ({ page }) => {
  await page.goto("/ar/onboarding");
  await page.getByRole("button", { name: "التالي" }).click();
  await page.getByRole("radio", { name: /حوالي 1200/ }).click();
  await page.getByRole("button", { name: "التالي" }).click();
  await page.locator("#lichess").fill("tester_1");
  await page.getByRole("button", { name: "ابدأ التعلّم" }).click();
  await page.waitForURL("**/ar/learn/**");

  await page.goto("/ar/learn/openings");
  await page.locator("a:visible", { hasText: "نظام لندن" }).first().click();
  await page.waitForURL("**/ar/openings/london");
  await page.locator("a:visible", { hasText: "ابدأ الدرس الأول" }).click();
  await page.waitForURL("**/ar/openings/london/start-1-l1");

  // Three intro slides, then the moves (shown by the arrow in a lesson).
  const lesson = page.locator(".lesson");
  for (const label of ["التالي", "التالي", "ابدأ"]) await lesson.getByRole("button", { name: label }).click();
  const phase = (p: string) => expect(page.locator(`.lesson[data-phase="${p}"]`)).toBeVisible({ timeout: 8000 });
  for (const [from, to] of [
    ["d2", "d4"],
    ["c1", "f4"],
    ["e2", "e3"],
    ["g1", "f3"],
    ["c2", "c3"],
    ["b1", "d2"],
  ]) {
    await phase("move");
    await expect(lesson.getByText("دورك: العب النقلة المشار إليها")).toBeVisible();
    await move(page, from, to);
    // Important moves show why they are played, then wait for "متابعة".
    await expect(page.locator('.lesson:is([data-phase="read"], [data-phase="busy"], [data-phase="end"])')).toBeVisible();
    if (await page.locator('.lesson[data-phase="read"]').isVisible()) await lesson.getByRole("button", { name: "متابعة" }).click();
  }
  // The line may end with a short explanation.
  await expect(page.locator('.lesson:is([data-phase="info"], [data-phase="end"])')).toBeVisible({ timeout: 8000 });
  if (await page.locator('.lesson[data-phase="info"]').isVisible()) await lesson.getByRole("button", { name: "التالي" }).click();

  await expect(lesson.getByRole("heading", { name: "أحسنت! أنهيت الدرس" })).toBeVisible();
  await expect(lesson.getByText("بلا أخطاء")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  // Saved on this device: the path continues with the drill.
  await lesson.getByRole("button", { name: "التالي: تمرين" }).click();
  await page.waitForURL("**/ar/openings/london/start-1-d1");
  await page.goto("/ar/openings/london");
  await expect(page.locator("a:visible", { hasText: "تابع" })).toHaveAttribute("href", "/ar/openings/london/start-1-d1");
});
