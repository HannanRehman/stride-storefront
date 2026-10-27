import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dark footer, utility bar and mobile footer keyboard controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".utility-bar")).toHaveCSS(
    "background-color",
    "rgb(17, 17, 17)",
  );
  await expect(page.locator(".main-header")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(page.locator(".announcement")).toHaveCSS(
    "background-color",
    "rgb(245, 245, 245)",
  );
  await expect(page.locator(".site-footer")).toHaveCSS(
    "background-color",
    "rgb(17, 17, 17)",
  );
  await page.setViewportSize({ width: 375, height: 844 });
  const group = page.locator(".footer-columns details").first();
  const summary = group.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(group).toHaveAttribute("open", "");
  await summary.press("Enter");
  await expect(group).not.toHaveAttribute("open", "");
  await summary.press("Enter");
  await expect(
    group.getByRole("link", { name: "All products", exact: true }),
  ).toBeVisible();
  const scan = await new AxeBuilder({ page }).include(".site-footer").analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page.locator(".back-top").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
});

test("desktop navigation and horizontal product rail work with a keyboard", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const men = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Men", exact: true });
  await men.focus();
  await expect(men).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".mega-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".mega-menu")).toHaveCount(0);
  const rail = page.locator(".product-rail .horizontal-rail");
  await page
    .getByRole("button", { name: "Scroll in good company right", exact: true })
    .click();
  await expect
    .poll(() => rail.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Scroll in good company left", exact: true })
    .click();
  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBe(0);
});

test("share action removes tracking parameters and handles permission failure", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) =>
          sessionStorage.setItem("audit-shared-url", value),
      },
    });
  });
  await page.goto("/product/pace-01-men?utm_source=test#details");
  await page
    .getByRole("button", { name: "Share this page", exact: true })
    .click();
  await expect(page.getByText("Link copied.", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("audit-shared-url")),
  ).toBe(new URL("/product/pace-01-men", page.url()).href);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("blocked");
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Share this page", exact: true })
    .click();
  await expect(
    page.getByText("Copy the page address from your browser to share it.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("catalog pagination, no-results recovery and customer information pages", async ({
  page,
}) => {
  await page.goto("/shop/all");
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.goto("/search?q=unfindable-audit-query");
  await expect(page.locator("main .product-card")).toHaveCount(0);
  for (const route of [
    "/contact",
    "/help",
    "/size-guide",
    "/shipping-returns",
    "/terms",
    "/privacy",
    "/launch",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    const scan = await new AxeBuilder({ page }).include("main").analyze();
    expect(
      scan.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
      route,
    ).toEqual([]);
  }
});
