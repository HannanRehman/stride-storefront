import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const owner = "c0d00000-0000-4000-8000-000000000001";
async function signIn(context: BrowserContext, sub = owner, aal = "aal2") {
  const payload = {
    sub,
    aal,
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
      id: sub,
      aud: "authenticated",
      role: "authenticated",
      email: "owner@example.invalid",
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
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54328/test/reset");
});
test("owner enrolls MFA; password-only admin and direct API are blocked until verified", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/login?next=/admin/orders");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("owner@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-owner-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/verify\?next=%2Fadmin%2Forders/);
  await expect(page.locator(".admin-shell")).toHaveCount(0);
  expect((await context.request.get("/api/admin/orders")).status()).toBe(428);
  expect(
    (await (await context.request.get("/api/admin/security")).json()).events,
  ).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page.screenshot({
    path: ".tools/owner-verification-mobile.png",
    fullPage: true,
  });
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/auth\/verify\?next=%2Fadmin%2Forders/);
  await expect(
    page.getByRole("navigation", { name: "Owner navigation" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Set up authenticator", exact: true })
    .click();
  await expect(
    page.getByAltText("Scan to set up your store authenticator"),
  ).toBeVisible();
  await page.getByLabel("Authenticator code", { exact: true }).fill("000000");
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not be verified",
  );
  await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  expect((await context.request.get("/api/admin/orders")).status()).toBe(200);
  await context.clearCookies();
  await page.goto("/login?next=/admin/orders");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("owner@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-owner-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/verify\?next=%2Fadmin%2Forders/);
  await expect(
    page.getByRole("heading", { name: "Verify your sign-in.", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".admin-shell")).toHaveCount(0);
  expect((await context.request.get("/api/admin/orders")).status()).toBe(428);
  const bypass = await context.request.get("/admin/orders", {
    headers: { "x-store-path": "/admin/security" },
    maxRedirects: 0,
  });
  expect(bypass.status()).toBe(307);
  expect(bypass.headers().location).toContain("/auth/verify");
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/auth\/verify\?next=/);
  await expect(
    page.getByLabel("Authenticator code", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".tools/owner-verification-mobile.png",
    fullPage: true,
  });
  await page.getByLabel("Authenticator code", { exact: true }).fill("000000");
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not be verified",
  );
  await expect(page).toHaveURL(/\/auth\/verify\?next=/);
  await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
  await page
    .getByRole("button", { name: "Verify and continue", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
});

test("verification cannot be used by guests or customers and does not accept external return URLs", async ({
  page,
  context,
}) => {
  await page.goto("/auth/verify?next=https://evil.example");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
  await signIn(context, "c0d00000-0000-4000-8000-000000000002", "aal1");
  await page.goto("/auth/verify?next=/admin/orders");
  await expect(page).toHaveURL(/\/account$/);
  expect((await context.request.get("/api/admin/security")).status()).toBe(403);
});
test("distributed login throttling counts attempts across separate clients", async ({
  playwright,
}) => {
  const a = await playwright.request.newContext(),
    b = await playwright.request.newContext();
  try {
    for (let i = 0; i < 9; i++) {
      const response = await (i % 2 ? a : b).post(
        "http://localhost:3101/api/auth/login",
        {
          headers: { Origin: "http://localhost:3101" },
          data: {
            email: "throttle@example.invalid",
            password: "not-a-real-password",
          },
        },
      );
      expect(response.status()).toBe(i < 8 ? 400 : 429);
    }
  } finally {
    await a.dispose();
    await b.dispose();
  }
});
test("CMS sections preserve drafts and mobile navigation shows the active section", async ({
  page,
  context,
}) => {
  await signIn(context);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/admin/content");
  await page.getByRole("button", { name: /Menu/ }).click();
  await expect(
    page.locator('nav[aria-label="Store management"] a[aria-current="page"]'),
  ).toHaveText("Content");
  await page.getByRole("button", { name: /Close menu/ }).click();
  await page.getByLabel("Headline line 1", { exact: true }).fill("OWN YOUR");
  await page.getByRole("tab", { name: "Contact", exact: true }).click();
  await expect(
    page.getByLabel("Headline line 1", { exact: true }),
  ).not.toBeVisible();
  await page
    .getByLabel("Support email", { exact: true })
    .fill("support@example.invalid");
  await page.getByRole("tab", { name: "Policies", exact: true }).click();
  await page
    .getByLabel("Delivery information", { exact: true })
    .fill("Fixture policy text only.");
  await page.getByRole("tab", { name: "Campaign", exact: true }).click();
  await expect(page.getByLabel("Headline line 1", { exact: true })).toHaveValue(
    "OWN YOUR",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("main [role=status]")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("Headline line 1", { exact: true })).toHaveValue(
    "OWN YOUR",
  );
  await page.getByRole("tab", { name: "Contact", exact: true }).click();
  await expect(page.getByLabel("Support email", { exact: true })).toHaveValue(
    "support@example.invalid",
  );
});
