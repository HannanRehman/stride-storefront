// Offline draft review only. No provider or mailbox is contacted.
import { readdir, readFile, mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const folder = "docs/email-templates";
const files = (await readdir(folder)).filter(
  (file) => file.endsWith(".html") && file !== "index.html",
);
const sample = {
  brand_name: "Brand name",
  order_reference: "#TEST1234",
  item_summary: "Navy hoodie and trouser set / M / Qty 1",
  delivery_charge: "PKR 250",
  order_total: "PKR 7,250",
};
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
await mkdir(".tools/email-previews", { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  let networkRequests = 0;
  await context.route("**/*", (route) => {
    networkRequests++;
    return route.abort();
  });
  for (const file of files) {
    const draft = await readFile(`${folder}/${file}`, "utf8");
    expect(draft).not.toMatch(/<script|<iframe|<form|<img/i);
    const rendered = draft.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
      const value =
        sample[key] ||
        (key.endsWith("_url")
          ? `https://store.example.invalid/${key.replaceAll("_", "-")}`
          : null);
      if (!value) throw new Error(`No preview value for ${key}`);
      return escape(value);
    });
    expect(rendered).not.toContain("{{");
    for (const width of [320, 375, 600, 900]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(rendered);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${file} at ${width}`,
      ).toBe(true);
    }
    for (const link of await page.getByRole("link").all()) {
      const url = new URL(await link.getAttribute("href"));
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("store.example.invalid");
    }
    const scan = await new AxeBuilder({ page }).analyze();
    expect(
      scan.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
      file,
    ).toEqual([]);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({
      path: `.tools/email-previews/${file.replace(".html", ".png")}`,
      fullPage: true,
    });
  }
  expect(networkRequests).toBe(0);
  console.log(
    `Passed ${files.length} offline HTML email drafts at 4 widths, safe preview links and serious/critical accessibility checks. No network requests or emails sent. Actual mail-client rendering remains unverified.`,
  );
} finally {
  await browser.close();
}
