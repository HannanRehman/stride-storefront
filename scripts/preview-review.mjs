import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
});
const page = await browser.newPage();
for (const [name, width, height, route] of [
  ["home-desktop", 1440, 1000, "/"],
  ["home-mobile", 390, 844, "/"],
  ["catalog-desktop", 1440, 1000, "/men/shoes"],
  ["catalog-mobile", 390, 844, "/men/shoes"],
  ["product-desktop", 1440, 1000, "/product/pace-01-men"],
]) {
  await page.setViewportSize({ width, height });
  await page.goto(`http://127.0.0.1:3000${route}`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `artifacts/${name}.png`,
    fullPage: name !== "product-desktop",
  });
  console.log(`${name}: ${await page.title()}`);
}
await browser.close();
