import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node contracts/mock/server.js",
      cwd: "../..",
      url: "http://localhost:4010/v1/lessons/L-103",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "node node_modules/vite/bin/vite.js --port 5174 --strictPort",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
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
