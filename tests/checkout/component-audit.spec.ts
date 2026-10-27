import { expect, test, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const owner = "c0d00000-0000-4000-8000-000000000001";
async function signIn(context: BrowserContext) {
  const payload = {
    sub: owner,
    aal: "aal2",
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.Zml4dHVyZQ`;
  const session = {
    access_token: token,
    refresh_token: "fixture-refresh",
    expires_in: 3600,
    expires_at: payload.exp,
    token_type: "bearer",
    user: {
      id: owner,
      email: "owner@example.invalid",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
    },
  };
  await context.addCookies([
    {
      name: "sb-127-auth-token",
      value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test("owner workspace and account screens render accessibly on a narrow screen", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(180000);
  await request.post("http://127.0.0.1:54328/test/reset");
  await signIn(context);
  await page.setViewportSize({ width: 375, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/admin",
    "/admin/products",
    "/admin/products/new",
    "/admin/orders",
    "/admin/requests",
    "/admin/content",
    "/admin/content/preview",
    "/admin/audience",
    "/admin/readiness",
    "/admin/security",
    "/account",
    "/account/profile",
    "/account/addresses",
    "/account/orders",
    "/account/requests",
    "/account/requests/new",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    const scan = await new AxeBuilder({ page }).analyze();
    expect(
      scan.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
      route,
    ).toEqual([]);
    await page.screenshot({
      path: `.tools/audit${route.replaceAll("/", "-")}-mobile.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("orders, support conversations and launch audience paginate without losing filters", async ({
  page,
  context,
  request,
}) => {
  await request.post("http://127.0.0.1:54328/test/reset");
  await request.post("http://127.0.0.1:54328/test/pagination");
  await signIn(context);
  await page.goto("/admin/orders");
  await expect(page.locator(".order-rows > li")).toHaveCount(20);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".order-rows > li")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Order status", exact: true })
    .selectOption("cancelled");
  await expect(page.locator(".order-rows > li")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Order status", exact: true })
    .selectOption("");
  await expect(page.locator(".order-rows > li")).toHaveCount(20);
  await page.goto("/admin/requests");
  await expect(page.locator(".order-rows > li")).toHaveCount(20);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".order-rows > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.getByRole("link").filter({ hasText: "Audit request 01" }).click();
  await expect(page.locator(".support-messages > li")).toHaveCount(50);
  await page
    .getByRole("button", { name: "Older messages", exact: true })
    .click();
  await expect(page.locator(".support-messages > li")).toHaveCount(1);
  await expect(page.locator(".support-messages")).toContainText("Message 51");
  await page
    .getByRole("button", { name: "Newer messages", exact: true })
    .click();
  await expect(page.locator(".support-messages > li")).toHaveCount(50);
  await page.goto("/admin/audience");
  await expect(page.locator(".audience-row")).toHaveCount(20);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".audience-row")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Signup status", exact: true })
    .selectOption("confirmed");
  await expect(page.locator(".audience-row")).toHaveCount(10);
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
});
