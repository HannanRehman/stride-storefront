import { test, expect } from "@playwright/test";
test("initial catalog HTML, search and URL filters work", async ({
  page,
  request,
}) => {
  const html = await (await request.get("/new")).text();
  expect(html).toMatch(/<h1(?:\s|>)/);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page.getByRole("combobox").fill("Pace");
  await expect(page.getByRole("option")).toHaveCount(5);
  await page.getByRole("combobox").press("ArrowDown");
  await page.getByRole("combobox").press("Enter");
  await expect(page).toHaveURL(/\/product\/pace-01-men/);
  await page.goto("/men/shoes?color=Chalk&size=10&sale=true&sort=price-asc");
  await expect(page.locator("main .product-card")).toHaveCount(2);
  await page.reload();
  await expect(page.locator("main .product-card")).toHaveCount(2);
});
test("guest bag, favorites, gallery and dialog focus survive navigation", async ({
  page,
}) => {
  await page.goto("/product/pace-01-men");
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View bag", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favorite", exact: true }).click();
  await page.goto("/cart");
  await expect(page.locator(".bag-line")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Sign in to checkout", exact: true }),
  ).toHaveAttribute("href", "/login?next=/checkout");
  await page.reload();
  await expect(page.locator(".bag-line")).toHaveCount(1);
  await page.goto("/favorites");
  await expect(page.locator("main .product-card")).toHaveCount(1);
  await page.goto("/product/navy-hoodie-trouser-set");
  await page
    .getByRole("button", { name: "View Hoodie photo", exact: true })
    .click();
  await expect(page.locator(".gallery-main img")).toHaveAttribute(
    "src",
    /navy-hoodie\.webp/,
  );
  const zoom = page.getByRole("button", {
    name: "Zoom Navy Hoodie & Trouser Set image",
    exact: true,
  });
  await zoom.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(zoom).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Try test checkout", exact: true }),
  ).toBeVisible();
});
test("small screens, footer groups and reduced motion remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/shop/clothing");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const group = page.locator(".footer-mobile details").first();
  await expect(group).not.toHaveAttribute("open", "");
  await group.locator("summary").click();
  await expect(group).toHaveAttribute("open", "");
  await expect(
    group.getByRole("link", { name: "All products", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});
test("private pages/APIs stay protected and test product is not indexed", async ({
  page,
  request,
}) => {
  await page.goto("/admin/security");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?next=/);
  for (const path of [
    "/api/admin/security",
    "/api/admin/orders",
    "/api/orders",
    "/api/requests",
  ]) {
    expect((await request.get(path)).status()).toBe(401);
  }
  await page.goto("/product/checkout-test-set");
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(
    page.getByText("Test product. Sign in with any store account", {
      exact: false,
    }),
  ).toBeVisible();
});
