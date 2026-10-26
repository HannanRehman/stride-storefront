import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/checkout",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3101",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/fixtures/orders-server.mjs",
    url: "http://localhost:3101/login",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
