import { test, expect, type BrowserContext } from "@playwright/test";
const owner = "c0d00000-0000-4000-8000-000000000001";
async function signIn(context: BrowserContext, sub = owner, aal = "aal1") {
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
  await signIn(context);
  await page.goto("/admin/security");
  await page
    .getByRole("button", { name: "Set up authenticator", exact: true })
    .click();
  await expect(
    page.getByAltText("Scan to set up your store authenticator"),
  ).toBeVisible();
  await page.getByLabel("Authenticator code", { exact: true }).fill("000000");
  await page
    .getByRole("button", { name: "Verify authenticator", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not be verified",
  );
  await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
  await page
    .getByRole("button", { name: "Verify authenticator", exact: true })
    .click();
  await expect(
    page.getByText("Authenticator verified.", { exact: false }),
  ).toBeVisible();
  expect((await context.request.get("/api/admin/orders")).status()).toBe(200);
  await signIn(context, owner, "aal1");
  expect((await context.request.get("/api/admin/orders")).status()).toBe(428);
  const bypass = await context.request.get("/admin/orders", {
    headers: { "x-store-path": "/admin/security" },
    maxRedirects: 0,
  });
  expect(bypass.status()).toBe(307);
  expect(bypass.headers().location).toContain("/admin/security");
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/security\?next=/);
  await expect(
    page.getByLabel("Authenticator code", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
  await page
    .getByRole("button", { name: "Verify authenticator", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Continue to dashboard", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Continue to dashboard", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
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
