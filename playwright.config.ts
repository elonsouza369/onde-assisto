import { defineConfig, devices } from "@playwright/test";

// Disponibiliza SUPABASE_URL etc. para decidir se o teste das listas roda.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
