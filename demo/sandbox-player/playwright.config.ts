import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const demoDir = path.dirname(fileURLToPath(import.meta.url));
const pagePort = Number(process.env.PORT || 5174);
const apiPort = Number(process.env.SAVANNA_API_PORT || 4010);
const apiTarget = process.env.SAVANNA_API_PROXY_TARGET || `http://localhost:${apiPort}`;

export default defineConfig({
  testDir: "./test",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${pagePort}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node node_modules/tsx/dist/cli.mjs watch src/server.ts",
      cwd: path.resolve(demoDir, "../../api"),
      url: `${apiTarget}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        NODE_ENV: "development",
        PORT: String(apiPort),
        STORE: "memory",
        PARTNERS: JSON.stringify([
          {
            name: "dev",
            key: "pk_dev_local",
            origins: [`http://localhost:${pagePort}`],
          },
        ]),
        // Browser cases intentionally reload lessons across many viewport
        // sizes; keep the application rate limit from masking those checks.
        RATE_LIMIT_PER_MIN: "1000",
      },
    },
    {
      command: "node node_modules/vite/bin/vite.js --strictPort",
      cwd: demoDir,
      url: `http://localhost:${pagePort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { PORT: String(pagePort), SAVANNA_API_PROXY_TARGET: apiTarget },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "chrome",
      },
    },
  ],
});
