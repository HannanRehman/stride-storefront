import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54328/test/reset");
});
test("guest shopping merges once, profile and addresses save, another device sees the bag", async ({
  page,
  browser,
  request,
}) => {
  await request.post("http://127.0.0.1:54328/test/empty-bag");
  await page.goto("/product/checkout-hoodie");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page
      .locator(".product-info [role=status]")
      .filter({ hasText: "Added to your bag." }),
  ).toBeVisible();
  await page.goto("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("customer@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page
    .getByRole("button", { name: "Show passwords", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/cart");
  await expect(page.locator(".bag-quantity span")).toHaveText("1");
  await page.reload();
  await expect(page.locator(".bag-quantity span")).toHaveText("1");
  await page.goto("/account/profile");
  await page.getByLabel("Full name", { exact: true }).fill("Fixture Customer");
  await page.getByLabel("Phone number", { exact: true }).fill("03001234567");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.locator("main [role=status]")).toContainText(
    "Profile saved",
  );
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Fixture Customer",
  );
  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  for (const [label, value] of [
    ["Address label", "Home"],
    ["Recipient name", "Fixture Customer"],
    ["Phone number", "03001234567"],
    ["Street address", "Test Street 12"],
    ["City", "Lahore"],
    ["Province / region", "Punjab"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(page.locator(".address-entry")).toContainText("Test Street 12");
  await page.getByRole("button", { name: "Edit Home", exact: true }).click();
  await page.getByLabel("City", { exact: true }).fill("Karachi");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(page.locator(".address-entry")).toContainText("Karachi");
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await second.goto("http://localhost:3101/login");
    await second
      .getByLabel("Email address", { exact: true })
      .fill("customer@example.invalid");
    await second
      .getByLabel("Password", { exact: true })
      .fill("fixture-password-123");
    await second.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(second).toHaveURL(/\/account$/);
    await second.goto("http://localhost:3101/cart");
    await expect(second.locator(".bag-quantity span")).toHaveText("1");
  } finally {
    await other.close();
  }
  await page.goto("/checkout");
  await page
    .getByRole("combobox", { name: "Saved delivery address", exact: true })
    .selectOption({ label: "Home \u00b7 Karachi" });
  await expect(page.getByLabel("Street address", { exact: true })).toHaveValue(
    "Test Street 12",
  );
  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Remove Home", exact: true }).click();
  await expect(page.locator(".address-entry")).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page }).include("main").analyze()
    ).violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/cart");
  await expect(page.locator(".bag-line")).toHaveCount(0);
});
test("registration and recovery use isolated email transport; recovery changes only the verified session", async ({
  page,
  context,
}) => {
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("New Fixture");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("fixture-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("main [role=status]")).toContainText(
    "Check your inbox",
  );
  await page.goto("/forgot-password");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("customer@example.invalid");
  await page
    .getByRole("button", { name: "Request recovery link", exact: true })
    .click();
  await expect(page.locator("main [role=status]")).toContainText(
    "If an account exists",
  );
  await page.goto(
    "/auth/callback?code=fixture-recovery-code&next=/reset-password",
  );
  await expect(page).toHaveURL(/\/reset-password$/);
  await page
    .getByLabel("New password", { exact: true })
    .fill("fixture-updated-password-456");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("fixture-updated-password-456");
  await page
    .getByRole("button", { name: "Save new password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?updated=1/);
  await expect(page.locator("main [role=status]")).toContainText(
    "password has been changed",
  );
  await expect(page.locator("main [role=alert]")).toHaveCount(0);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("customer@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Unable to sign in",
  );
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-updated-password-456");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  expect(
    (
      await context.request.post("/api/auth/password", {
        headers: { Origin: "http://localhost:3101" },
        data: {
          password: "another-password-789",
          confirmPassword: "another-password-789",
        },
      })
    ).status(),
  ).toBe(403);
});
