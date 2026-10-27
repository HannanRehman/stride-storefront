// Read-only production-mode smoke. Starts/stops only its own local server.
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const port = 3200,
  base = `http://localhost:${port}`;
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, "localhost", resolve);
});
await new Promise((resolve) => probe.close(resolve));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "localhost",
    "--port",
    String(port),
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (b) => {
    logs = (logs + b.toString()).slice(-3000);
  });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const r = await fetch(base);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Production preview did not start: " + logs);
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  if (!canonical || new URL(canonical).pathname !== "/")
    throw new Error("Missing homepage canonical");
  const social = await page
    .locator('meta[property="og:image"]')
    .first()
    .getAttribute("content");
  if (!social) throw new Error("Missing social image");
  const socialPath = new URL(social, base);
  const img = await fetch(base + socialPath.pathname + socialPath.search);
  const bytes = Buffer.from(await img.arrayBuffer());
  if (
    !img.ok ||
    bytes.readUInt32BE(16) !== 1200 ||
    bytes.readUInt32BE(20) !== 630
  )
    throw new Error("Social image did not render at 1200×630");
  const root = await fetch(base);
  if (
    root.headers.get("x-content-type-options") !== "nosniff" ||
    root.headers.get("x-frame-options") !== "SAMEORIGIN"
  )
    throw new Error("Missing security headers");
  const sitemapResponse = await fetch(base + "/sitemap.xml");
  expect(sitemapResponse.status).toBe(200);
  expect(sitemapResponse.headers.get("content-type")).toContain("xml");
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => new URL(match[1]),
  );
  expect(locations.length).toBeGreaterThan(0);
  expect(new Set(locations.map((url) => url.href)).size).toBe(locations.length);
  const publicPaths = locations.map((url) => url.pathname);
  expect(publicPaths).toEqual(
    expect.arrayContaining([
      "/",
      "/shop/clothing",
      "/product/navy-hoodie-trouser-set",
    ]),
  );
  for (const url of locations) {
    expect(url.origin).toBe(new URL(canonical).origin);
    expect(url.search).toBe("");
    expect(url.pathname).not.toMatch(
      /^\/(?:admin|account|api|auth|cart|checkout|favorites|search|login|register|forgot-password|reset-password)(?:\/|$)/,
    );
    expect(url.pathname).not.toBe("/product/checkout-test-set");
  }
  const robotsResponse = await fetch(base + "/robots.txt");
  expect(robotsResponse.status).toBe(200);
  expect(await robotsResponse.text()).toContain(
    `Sitemap: ${new URL(canonical).origin}/sitemap.xml`,
  );
  await mkdir(".tools", { recursive: true });
  await page.screenshot({
    path: ".tools/production-home-desktop.png",
    fullPage: true,
  });
  await page.goto(base + "/product/navy-hoodie-trouser-set");
  await expect(
    page.locator(".product-info").getByText("PKR 7,000", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View Hoodie photo", exact: true })
    .click();
  await page.locator(".gallery-photo img").evaluate((img) => img.decode());
  for (const path of [
    "/contact",
    "/launch",
    "/privacy",
    "/shipping-returns",
    "/terms",
  ]) {
    await page.goto(base + path);
    await expect(page.locator("main h1")).toHaveCount(1);
  }
  for (const path of [
    "/missing-page-production-check",
    "/product/missing-product-production-check",
  ]) {
    const response = await page.goto(base + path);
    // Next can stream a not-found response with HTTP 200; it must still be
    // explicitly noindex and show the custom recovery UI in either case.
    expect([200, 404]).toContain(response?.status());
    await expect(
      page.getByRole("heading", {
        name: "A DIFFERENT DIRECTION.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]').first(),
    ).toHaveAttribute("content", /noindex/);
    await expect(
      page.getByRole("link", { name: "Explore Stride", exact: true }),
    ).toHaveAttribute("href", "/shop/all");
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(base);
  if (
    !(await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ))
  )
    throw new Error("Mobile homepage overflow");
  await page.screenshot({
    path: ".tools/production-home-mobile.png",
    fullPage: true,
  });
  for (const path of [
    "/admin/content",
    "/auth/verify",
    "/admin/orders",
    "/account/orders",
    "/account/requests",
    "/checkout",
  ]) {
    const r = await fetch(base + path, { redirect: "manual" });
    const location = r.headers.get("location");
    if (![302, 307].includes(r.status) || !location?.startsWith("/login?next="))
      throw new Error("Unprotected private page: " + path);
  }
  for (const path of [
    "/api/admin/content",
    "/api/admin/readiness",
    "/api/orders",
    "/api/requests",
    "/api/account/checkout-details",
  ]) {
    const r = await fetch(base + path);
    if (
      r.status !== 401 ||
      !r.headers.get("cache-control")?.includes("no-store")
    )
      throw new Error("Unprotected private API: " + path);
  }
  const worker = await fetch(base + "/api/internal/email-worker", {
    method: "POST",
  });
  if (worker.status !== 401)
    throw new Error("Email worker must require authorization");
  const cron = await fetch(base + "/api/internal/email-worker");
  if (cron.status !== 401)
    throw new Error("Email scheduler must require authorization");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Production smoke passed: public pages, product gallery, custom 404/noindex, sitemap/robots, canonical/social PNG, mobile layout, security headers, private routes/APIs and disabled unauthorized email worker; zero browser page errors.",
  );
} finally {
  if (browser) await browser.close();
  child.kill();
}
