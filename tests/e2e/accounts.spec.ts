import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("private pages require sign-in and callback errors stay local", async ({
  page,
}) => {
  await page.goto("/account/addresses");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.goto("/auth/callback?code=invalid&next=https://evil.example");
  await expect(page).toHaveURL(/\/login\?callbackError=1/);
  await expect(page.getByRole("alert")).toContainText("could not be verified");
  await page.goto("/reset-password");
  await expect(page).toHaveURL(/\/forgot-password/);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});
test("auth rejects foreign origins and protected writes", async ({
  request,
}) => {
  const foreign = await request.post("/api/auth/login", {
    headers: { Origin: "https://evil.example" },
    data: { email: "user@example.invalid", password: "invalid" },
  });
  expect([400, 503]).toContain(foreign.status());
  const anonymous = await request.post("/api/account/store", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { action: "read" },
  });
  expect(anonymous.status()).toBe(401);
});
test("account shopping merges once, persists across devices, and profile/addresses work", async ({
  page,
  browser,
}) => {
  test.skip(
    !process.env.ACCOUNT_TEST_EMAIL || !process.env.ACCOUNT_TEST_PASSWORD,
    "Use isolated temporary auth fixtures for the hosted account journey.",
  );
  test.setTimeout(120000);
  await page.goto("/product/pace-01-men");
  await expect
    .poll(() =>
      page.evaluate(() => fetch("/api/account/session").then((r) => r.status)),
    )
    .toBe(200);
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View bag", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Favorite", exact: true }).click();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(process.env.ACCOUNT_TEST_EMAIL!);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.ACCOUNT_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/cart");
  await expect(page.locator(".bag-quantity span")).toHaveText("1");
  await page.reload();
  await expect(page.locator(".bag-quantity span")).toHaveText("1");
  await page.goto("/account/profile");
  await page.getByLabel("Full name").fill("Account Test Customer");
  await page.getByLabel("Phone number").fill("03001234567");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Profile saved." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue(
    "Account Test Customer",
  );
  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Add address" }).click();
  for (const [name, value] of [
    ["Address label", "Home"],
    ["Recipient name", "Test Customer"],
    ["Phone number", "03001234567"],
    ["Street address", "Test street"],
    ["City", "Lahore"],
    ["Province / region", "Punjab"],
  ])
    await page.getByLabel(name, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.locator(".address-entry")).toContainText("Test street");
  await page.getByRole("button", { name: "Edit Home" }).click();
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.locator(".address-entry")).toContainText("Karachi");
  const other = await browser.newContext();
  const device = await other.newPage();
  try {
    await device.goto("http://127.0.0.1:3000/login");
    await device
      .getByLabel("Email address")
      .fill(process.env.ACCOUNT_TEST_EMAIL!);
    await device
      .getByLabel("Password", { exact: true })
      .fill(process.env.ACCOUNT_TEST_PASSWORD!);
    await device.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(device).toHaveURL(/\/account$/);
    await device.goto("http://127.0.0.1:3000/cart");
    await expect(device.locator(".bag-quantity span")).toHaveText("1");
    await device.goto("http://127.0.0.1:3000/favorites");
    await expect(device.locator("main .product-card")).toHaveCount(1);
  } finally {
    await other.close();
  }
  await page.getByRole("button", { name: "Remove Home" }).click();
  await expect(page.locator(".address-entry")).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(
    axe.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/cart");
  await expect(page.locator(".bag-line")).toHaveCount(0);
});
