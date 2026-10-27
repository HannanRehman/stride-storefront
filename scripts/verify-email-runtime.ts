// Offline browser acceptance for the real renderer and prepared Auth templates.
// Never calls Supabase, Resend or an inbox.
import { mkdir, readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { emailMessage, type EmailJob } from "../src/lib/email";

const site = "https://store.example.invalid";
const id = "d0c00000-0000-4000-8000-000000000010";
const token = "d0c00000-0000-4000-8000-000000000011";
const base: EmailJob = {
  id,
  lease: token,
  kind: "order_status",
  recipient: "customer@example.invalid",
  payload: {},
};
const messages = [
  ...["pending", "confirmed", "shipped", "delivered", "cancelled"].map(
    (status) => ({
      name: status,
      ...emailMessage({ ...base, payload: { orderId: id, status } }, site),
    }),
  ),
  {
    name: "support",
    ...emailMessage(
      { ...base, kind: "support_reply", payload: { requestId: id } },
      site,
    ),
  },
  {
    name: "launch",
    ...emailMessage(
      {
        ...base,
        kind: "launch_confirmation",
        payload: { confirmationToken: id, unsubscribeToken: token },
      },
      site,
    ),
  },
];
for (const name of ["confirm-signup", "reset-password"]) {
  const source = await readFile(
    `docs/email-templates/supabase/${name}.html`,
    "utf8",
  );
  expect(source.match(/\{\{ \.ConfirmationURL \}\}/g)).toHaveLength(3);
  expect(source).not.toMatch(/\{\{[a-z_]+\}\}/);
  messages.push({
    name,
    subject: name,
    text: name,
    html: source.replaceAll(
      "{{ .ConfirmationURL }}",
      "https://example.supabase.co/auth/v1/verify?token=preview&amp;type=recovery",
    ),
  });
}
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
await mkdir(".tools/email-runtime", { recursive: true });
let requests = 0;
try {
  const context = await browser.newContext();
  await context.route("**/*", (route) => {
    requests++;
    return route.abort();
  });
  const page = await context.newPage();
  for (const message of messages) {
    expect(message.html).not.toMatch(/<script|<iframe|<form|<img|\{\{/i);
    await page.setContent(message.html);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const width of [320, 375, 600, 900]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${message.name} at ${width}px`,
      ).toBe(true);
    }
    for (const link of await page.getByRole("link").all()) {
      const url = new URL((await link.getAttribute("href"))!);
      expect(url.protocol).toBe("https:");
      expect([
        "store.example.invalid",
        "example.supabase.co",
        "stride-storefront-peach.vercel.app",
      ]).toContain(url.hostname);
    }
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
      message.name,
    ).toEqual([]);
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({
      path: `.tools/email-runtime/${message.name}.png`,
      fullPage: true,
    });
  }
  expect(requests).toBe(0);
  console.log(
    `Passed ${messages.length} runtime/Auth email layouts at four widths with safe links, zero serious/critical axe findings and zero network requests. No emails sent.`,
  );
} finally {
  await browser.close();
}
