// Local production crawl, visual evidence and a small lab performance sample.
// No signed-in session, orders or messages are created.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium, expect } from "@playwright/test";

const port = 3201;
const base = `http://127.0.0.1:${port}`;
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, "127.0.0.1", resolve);
});
await new Promise((resolve) => probe.close(resolve));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "",
  browser;
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (b) => {
    logs = (logs + b).slice(-4000);
  });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Production server did not start: " + logs);
  const sitemap = await (await fetch(base + "/sitemap.xml")).text();
  const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (m) => new URL(m[1]).pathname,
  );
  expect(paths).not.toContain("/product/checkout-test-set");
  const clientRenderedCatalogs = [];
  for (let offset = 0; offset < paths.length; offset += 4) {
    await Promise.all(
      paths.slice(offset, offset + 4).map(async (path) => {
        const response = await fetch(base + path);
        expect(response.status, path).toBe(200);
        const html = await response.text();
        expect(html, path).toContain("<main");
        const headings = html.match(/<h1(?:\s|>)/g) || [];
        // A statically rendered catalog's search-param client subtree uses its
        // documented Suspense fallback until hydration. Check its real DOM below.
        if (!headings.length && html.includes("catalog-loading"))
          clientRenderedCatalogs.push(path);
        else expect(headings, path).toHaveLength(1);
      }),
    );
  }
  await mkdir(".tools/full-audit", { recursive: true });
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  });
  const measurements = [],
    errors = [];
  for (const mobile of [false, true]) {
    for (const route of [
      "/",
      "/new",
      "/shop/clothing",
      "/product/navy-hoodie-trouser-set",
    ]) {
      const context = await browser.newContext({
        viewport: { width: mobile ? 390 : 1440, height: 900 },
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push({ route, message: e.message }));
      await page.addInitScript(() => {
        const state = {
          lcp: 0,
          cls: 0,
          score: 0,
          start: 0,
          last: 0,
          shifts: [],
          lcpElement: "",
        };
        window.__auditVitals = state;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            state.lcp = entry.startTime;
            state.lcpElement = entry.element
              ? `${entry.element.tagName}.${entry.element.className}`
              : "";
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.hadRecentInput) continue;
            state.shifts.push({
              value: entry.value,
              sources: (entry.sources || []).map((s) => ({
                node: s.node
                  ? `${s.node.nodeName}.${s.node.className || ""}`
                  : "",
                previous: s.previousRect.toJSON(),
                current: s.currentRect.toJSON(),
              })),
            });
            if (
              state.last &&
              entry.startTime - state.last < 1000 &&
              entry.startTime - state.start < 5000
            )
              state.score += entry.value;
            else {
              state.start = entry.startTime;
              state.score = entry.value;
            }
            state.last = entry.startTime;
            state.cls = Math.max(state.cls, state.score);
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      if (mobile) {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 100,
          downloadThroughput: 400000,
          uploadThroughput: 200000,
        });
      }
      await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
      await expect(page.locator("main h1")).toHaveCount(1);
      await page.waitForTimeout(1500);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      const sample = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          lcp_ms: Math.round(window.__auditVitals.lcp),
          cls: Number(window.__auditVitals.cls.toFixed(4)),
          dom_ready_ms: Math.round(nav.domContentLoadedEventEnd),
          resources: performance.getEntriesByType("resource").length,
          lcpElement: window.__auditVitals.lcpElement,
          shifts: window.__auditVitals.shifts.filter((s) => s.value > 0.01),
          largestResources: performance
            .getEntriesByType("resource")
            .filter((r) => r.transferSize > 0)
            .sort((a, b) => b.transferSize - a.transferSize)
            .slice(0, 8)
            .map((r) => ({
              url: r.name.replace(location.origin, ""),
              bytes: r.transferSize,
              duration_ms: Math.round(r.duration),
            })),
        };
      });
      measurements.push({
        route,
        profile: mobile
          ? "390px / 4x CPU / 100ms latency / 3.2Mbps"
          : "1440px / unthrottled",
        ...sample,
      });
      await page.screenshot({
        path: `.tools/full-audit/${route === "/" ? "home" : route.replaceAll("/", "-")}-${mobile ? "mobile" : "desktop"}.png`,
        fullPage: true,
      });
      await context.close();
    }
  }
  expect(errors).toEqual([]);
  const result = {
    publicPages: paths.length,
    clientRenderedCatalogs,
    browserErrors: errors,
    measurements,
    limitation:
      "Single local lab sample per route/profile; not field Core Web Vitals, a Lighthouse score, or a load/concurrency test.",
  };
  await writeFile(
    ".tools/full-audit/production-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) await browser.close();
  child.kill();
}
