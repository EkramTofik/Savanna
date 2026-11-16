import { defineConfig, devices } from "@playwright/test";

const apiPort = Number(process.env.SAVANNA_API_TEST_PORT ?? 4011);
const playerPort = Number(process.env.SAVANNA_PLAYER_TEST_PORT ?? 5175);
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const playerOrigin = `http://127.0.0.1:${playerPort}`;
const reuseExistingServers = process.env.REUSE_PLAYWRIGHT_SERVERS === "true";

export default defineConfig({
  testDir: "./test",
  timeout: 60_000,
  use: {
    baseURL: playerOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node contracts/mock/server.js",
      cwd: "../..",
      url: `${apiOrigin}/v1/lessons/L-103`,
      env: { ...process.env, MOCK_PORT: String(apiPort), FIXTURE_URL_ORIGIN: playerOrigin },
      reuseExistingServer: reuseExistingServers,
      timeout: 30_000,
    },
    {
      command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${playerPort} --strictPort`,
      url: playerOrigin,
      env: {
        ...process.env,
        SAVANNA_API_TEST_ORIGIN: apiOrigin,
        SAVANNA_PLAYER_TEST_ORIGIN: playerOrigin,
      },
      reuseExistingServer: reuseExistingServers,
      timeout: 30_000,
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
