import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("smooth scrolling pauses for dialogs and restores keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(150);
  const search = page.getByRole("button", {
    name: "Search products",
    exact: true,
  });
  await search.click();
  await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
  await page.getByRole("combobox").press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveAttribute("data-scroll-locked");
  await expect(search).toBeFocused();
});
test("home, catalog, product, favorites and persistent bag", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "NEXT GEAR",
  );
  await page.getByRole("link", { name: "Shop men", exact: true }).click();
  await page.getByRole("link", { name: "Shop shoes", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Men's shoes",
  );
  await page.getByLabel("Sort products").selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.goto("/product/pace-01-men");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.locator("#size-error")).toContainText(
    "Choose an available size",
  );
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View bag", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favorite", exact: true }).click();
  await page.goto("/favorites");
  await expect(page.locator("main .product-card")).toHaveCount(1);
  await page.goto("/cart");
  await expect(page.locator(".bag-line")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".bag-line")).toHaveCount(1);
  await page.getByRole("button", { name: "Increase Pace 01 quantity" }).click();
  await expect(page.locator(".bag-quantity span")).toHaveText("2");
  await expect(page.locator(".bag-total")).toContainText("$256");
  await page.getByRole("button", { name: "Remove Pace 01 from bag" }).click();
  await expect(
    page.getByRole("heading", { name: "Good things are ahead." }),
  ).toBeVisible();
});
test("URL filters persist and back restores previous state", async ({
  page,
}) => {
  await page.goto("/men/shoes?color=Chalk&size=10&sale=true&sort=price-asc");
  await expect(page.locator("main .product-card")).toHaveCount(2);
  await page.reload();
  await expect(page.locator("main .product-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Running", exact: true }).click();
  await expect(page.locator("main .product-card")).toHaveCount(1);
  await page.goBack();
  await expect(page.locator("main .product-card")).toHaveCount(2);
});
test("search overlay and keyboard selection work", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page.getByRole("combobox").fill("Pace");
  await expect(page.getByRole("option")).toHaveCount(5);
  await page.getByRole("combobox").press("ArrowDown");
  await page.getByRole("combobox").press("Enter");
  await expect(page).toHaveURL(/\/product\/pace-01-men/);
});
test("mobile navigation, filter sheet and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Men", exact: true })
    .click();
  await page.goto("/men/shoes");
  await page.getByRole("button", { name: "Filter & sort" }).click();
  await page.getByRole("dialog").getByText("Running", { exact: true }).click();
  await page.getByRole("button", { name: /Show \d+ results/ }).click();
  await expect(page).toHaveURL(/sport=Running/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});
test("core pages have no serious accessibility violations", async ({
  page,
}) => {
  for (const route of ["/", "/men/shoes", "/product/pace-01-men", "/cart"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
      route,
    ).toEqual([]);
  }
});
test("public layout stays within viewport", async ({ page }) => {
  for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `home at ${width}`,
    ).toBe(true);
    await page.goto("/men/shoes");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `catalog at ${width}`,
    ).toBe(true);
  }
});
test("moving a bag item saves the favorite atomically", async ({ page }) => {
  await page.goto("/product/pace-01-men");
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Move Pace 01 to favorites" }).click();
  await expect(page.locator(".bag-line")).toHaveCount(0);
  await page.goto("/favorites");
  await expect(page.locator("main .product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("main .product-card")).toHaveCount(1);
});
test("missing product media has a fallback and unknown products are not indexed", async ({
  page,
}) => {
  await page.route("**/_next/image?**", (route) => route.abort());
  await page.goto("/product/pace-01-men");
  await expect(page.locator(".gallery-main img")).toHaveAttribute(
    "src",
    "/images/fallback.svg",
  );
  const response = await page.goto("/product/does-not-exist");
  // Next.js returns 200 for streamed not-found responses, with noindex metadata.
  expect([200, 404]).toContain(response?.status());
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "DIFFERENT DIRECTION",
  );
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
});
