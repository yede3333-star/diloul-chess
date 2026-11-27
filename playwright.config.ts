import { defineConfig, devices } from "@playwright/test";

// E2E on a phone-sized screen (SPEC §15.4). Runs against a production build:
//   npm run build && npm run test:e2e
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
  },
  projects: [
    {
      name: "phone-360",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 760 }, locale: "ar-MR" },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/ar/learn/basics`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
