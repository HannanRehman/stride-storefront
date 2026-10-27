import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/cross-browser",
  workers: 1,
  timeout: 90000,
  use: { baseURL: "http://127.0.0.1:3203", trace: "retain-on-failure" },
  projects: [
    { name: "chrome", use: { browserName: "chromium", channel: "chrome" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    command:
      "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3203",
    url: "http://127.0.0.1:3203",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
