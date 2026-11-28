import { expect, test, type Locator, type Page } from "@playwright/test";

async function tapSquare(page: Page, board: Locator, square: string) {
  const box = (await board.locator("cg-board").boundingBox())!;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  await page.touchscreen.tap(box.x + (file + 0.5) * (box.width / 8), box.y + (7 - rank + 0.5) * (box.height / 8));
}

// Acceptance test from the phone review: 30 moves at 360px, never any sideways scroll.
test("30 tapped moves at 360px: legal only, history wraps, no horizontal scroll", async ({ page }) => {
  await page.goto("/ar/dev/components");
  const board = page.locator(".dboard").first();
  await board.scrollIntoViewIfNeeded();

  const moves = "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8 h2h3 c6b8 d2d4 b8d7 c3c4 c7c6 c4b5 a6b5 b1c3 c8b7 c1g5 b5b4 c3b1 h7h6".split(" ");
  for (const m of moves) {
    await tapSquare(page, board, m.slice(0, 2));
    await tapSquare(page, board, m.slice(2, 4));
    await page.waitForTimeout(120);
    const [scrollWidth, scrollX] = await page.evaluate(() => [document.documentElement.scrollWidth, window.scrollX]);
    expect(scrollWidth).toBeLessThanOrEqual(360);
    expect(scrollX).toBe(0);
  }
  const history = page.getByTestId("move-history");
  await expect(history).toContainText("15.");
  const { sw, cw } = await history.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
  expect(sw).toBeLessThanOrEqual(cw);

  // An illegal move (rook through its own pawn) does nothing.
  await tapSquare(page, board, "a1");
  await tapSquare(page, board, "a5");
  await expect(history).toContainText("15.");
  await expect(history).not.toContainText("16.");
});
