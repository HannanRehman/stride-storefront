import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/admin",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3100",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/fixtures/admin-server.mjs",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
