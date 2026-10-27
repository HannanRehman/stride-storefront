import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("navy set has a complete PKR preview without unconfirmed shopping actions", async ({
  page,
}) => {
  await page.goto("/shop/clothing");
  const card = page.locator(".product-card").filter({
    has: page.getByRole("heading", { name: "Navy Hoodie & Trouser Set" }),
  });
  await expect(card.getByText("PKR 7,000", { exact: true })).toBeVisible();
  await expect(card.getByRole("button")).toHaveCount(0);
  await card.getByRole("heading").click();
  await expect(page).toHaveURL(/\/product\/navy-hoodie-trouser-set$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Navy Hoodie & Trouser Set",
  );
  await expect(page.getByText("PKR 7,000", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Temporary price for the complete set/),
  ).toBeVisible();
  for (const size of ["S", "M", "L", "XL"]) {
    await expect(
      page.getByRole("button", {
        name: `${size}, stock to be confirmed`,
        exact: true,
      }),
    ).toBeDisabled();
  }
  await expect(
    page.getByRole("link", { name: "Try test checkout" }),
  ).toHaveAttribute("href", "/product/checkout-test-set");
  await expect(
    page.getByRole("button", { name: "Favorite", exact: true }),
  ).toHaveCount(0);
  const photo = page.locator(".gallery-photo img");
  await expect(photo).toBeVisible();
  await expect
    .poll(() =>
      photo.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(photo).toHaveAttribute("src", /navy-hoodie-trouser-set/);
  const thumbnails = page.getByRole("group", { name: "Product photographs" });
  await expect(thumbnails.getByRole("button")).toHaveCount(3);
  const hoodieThumbnail = thumbnails.getByRole("button", {
    name: "View Hoodie photo",
  });
  await hoodieThumbnail.focus();
  await hoodieThumbnail.press("Enter");
  await expect(hoodieThumbnail).toHaveAttribute("aria-pressed", "true");
  await expect(photo).toHaveAttribute("src", /navy-hoodie\.webp/);
  await expect
    .poll(() =>
      photo.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Zoom Navy Hoodie & Trouser Set image" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute(
    "src",
    /navy-hoodie\.webp/,
  );
  await page.keyboard.press("Escape");
  await thumbnails.getByRole("button", { name: "View Trouser photo" }).click();
  await expect(photo).toHaveAttribute("src", /navy-trouser\.webp/);
  await expect
    .poll(() =>
      photo.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await thumbnails.getByRole("button", { name: "View Full set photo" }).click();
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact || ""),
    ),
  ).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 960 });
  await photo.evaluate((img: HTMLImageElement) => img.decode());
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.screenshot({
    path: "artifacts/navy-set-desktop.png",
    fullPage: true,
  });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await photo.evaluate((img: HTMLImageElement) => img.decode());
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: "artifacts/navy-set-mobile.png",
    fullPage: true,
  });
});

test("navy set is discoverable from the homepage and search", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Navy Hoodie & Trouser Set" }),
  ).toBeVisible();
  await page.goto("/search?q=navy");
  await expect(
    page.getByRole("heading", { name: "Navy Hoodie & Trouser Set" }),
  ).toBeVisible();
  await expect(page.getByText("PKR 7,000", { exact: true })).toBeVisible();
});
