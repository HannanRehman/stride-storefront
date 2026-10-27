import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { defaultContent } from "../../src/lib/site-content";
const owner = "c0d00000-0000-4000-8000-000000000001",
  customer = "c0d00000-0000-4000-8000-000000000002",
  other = "c0d00000-0000-4000-8000-000000000003";
async function signIn(context: BrowserContext, sub = owner) {
  const payload = {
    sub,
    aal: sub === owner ? "aal2" : "aal1",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    iss: "http://127.0.0.1:54328/auth/v1",
    role: "authenticated",
  };
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${Buffer.from("fixture").toString("base64url")}`;
  const session = {
    access_token: token,
    refresh_token: "fixture-refresh",
    expires_at: payload.exp,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: sub,
      aud: "authenticated",
      role: "authenticated",
      email: "customer@example.invalid",
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
const headers = { Origin: "http://localhost:3101" };
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54328/test/reset");
});
test("a lost support response is recovered after refresh without creating another request", async ({
  page,
  context,
  request,
}) => {
  await signIn(context, customer);
  await page.goto("/account/requests/new");
  await page.getByLabel("Subject", { exact: true }).fill("Connection question");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Please confirm my request was received.");
  await request.post("http://127.0.0.1:54328/test/fail-support");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry the same request", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry the same request", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Retry the same request", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Request received", exact: true }),
  ).toBeVisible();
  const list = await (await context.request.get("/api/requests")).json();
  expect(list.count).toBe(1);
});
test("owner CMS drafts stay private, preview and publication work with stale protection", async ({
  page,
  context,
  request,
}) => {
  expect((await request.get("/api/admin/content")).status()).toBe(401);
  await signIn(context, customer);
  expect((await context.request.get("/api/admin/content")).status()).toBe(403);
  await signIn(context);
  await page.goto("/admin/content");
  await expect(page.getByLabel("Headline line 1", { exact: true })).toHaveValue(
    "FIND YOUR",
  );
  await page.getByLabel("Headline line 1", { exact: true }).fill("WEAR YOUR");
  await page.getByLabel("Headline line 2", { exact: true }).fill("OWN PACE.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("main [role=status]")).toContainText("Draft saved");
  const before = await request.get("/");
  expect(await before.text()).not.toContain("WEAR YOUR");
  const popupPromise = context.waitForEvent("page");
  await page
    .getByRole("link", { name: "Preview saved draft", exact: true })
    .click();
  const preview = await popupPromise;
  await expect(preview.getByRole("heading", { level: 1 })).toContainText(
    "WEAR YOUR",
  );
  await preview.close();
  await page
    .getByRole("button", { name: "Publish saved draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish content", exact: true })
    .click();
  await expect(page.locator("main [role=status]")).toContainText("Published.");
  expect(await (await request.get("/")).text()).toContain("WEAR YOUR");
  expect(
    (
      await context.request.post("/api/admin/content", {
        headers,
        data: { action: "publish", version: 0 },
      })
    ).status(),
  ).toBe(409);
  await page.screenshot({
    path: ".tools/content-editor-desktop.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page }).include("main").analyze()
    ).violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
});
test("customer and owner exchange private help messages and resolve a request", async ({
  page,
  context,
}) => {
  await signIn(context, customer);
  await page.goto("/account/requests/new");
  await page.getByLabel("Subject", { exact: true }).fill("Sizing question");
  await page
    .getByLabel("Message", { exact: true })
    .fill("How should I measure a hoodie?");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Request received", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View your request", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/requests\/[a-f0-9-]{36}$/);
  const id = page.url().split("/").pop()!;
  await expect(page.locator(".support-messages")).toContainText(
    "How should I measure",
  );
  await page
    .getByLabel("Reply", { exact: true })
    .fill("I usually wear medium.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.locator(".support-messages li")).toHaveCount(2);
  await signIn(context, other);
  expect((await context.request.get(`/api/requests/${id}`)).status()).toBe(404);
  expect(
    (await context.request.get(`/api/admin/requests/${id}`)).status(),
  ).toBe(403);
  await signIn(context);
  await page.goto(`/admin/requests/${id}`);
  await page
    .getByLabel("Reply", { exact: true })
    .fill("Use the chest measurement in the size guide.");
  await page.getByRole("button", { name: "Send reply", exact: true }).click();
  await expect(page.locator(".support-messages li")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Mark resolved", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mark open", exact: true }),
  ).toBeEnabled();
  await signIn(context, customer);
  await page.goto(`/account/requests/${id}`);
  await expect(page.locator(".support-messages")).toContainText(
    "Use the chest measurement",
  );
  await expect(
    page.getByRole("button", { name: "Send reply", exact: true }),
  ).toHaveCount(0);
});
test("launch interest requires consent, deduplicates and confirms only on explicit action", async ({
  page,
  context,
  request,
}) => {
  await signIn(context);
  const saved = await context.request.post("/api/admin/content", {
    headers,
    data: {
      action: "save",
      version: 0,
      document: { ...defaultContent, launchEnabled: true },
    },
  });
  expect(saved.status()).toBe(200);
  expect(
    (
      await context.request.post("/api/admin/content", {
        headers,
        data: { action: "publish", version: 1 },
      })
    ).status(),
  ).toBe(200);
  await context.clearCookies();
  await page.goto("/launch");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("interest@example.invalid");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Keep me posted", exact: true })
    .click();
  await expect(page.locator("main [role=status]")).toContainText("recorded");
  const signup = await context.request.post("/api/launch", {
    headers,
    data: {
      action: "subscribe",
      email: "INTEREST@example.invalid",
      consent: true,
      website: "",
    },
  });
  expect(signup.status()).toBe(200);
  const state = await (
    await request.get("http://127.0.0.1:54328/test/operations")
  ).json();
  expect(state.audience).toHaveLength(1);
  expect(state.audience[0].status).toBe("unconfirmed");
  const person = state.audience[0];
  await page.goto(
    `/launch/preferences?action=confirm&token=${person.confirmation_token}`,
  );
  expect(
    (await (await request.get("http://127.0.0.1:54328/test/operations")).json())
      .audience[0].status,
  ).toBe("unconfirmed");
  await page
    .getByRole("button", { name: "Confirm launch updates", exact: true })
    .click();
  await expect(page.locator("main [role=status]")).toContainText("saved");
  await page.goto(
    `/launch/preferences?action=unsubscribe&token=${person.unsubscribe_token}`,
  );
  await page
    .getByRole("button", {
      name: "Unsubscribe from launch updates",
      exact: true,
    })
    .click();
  await expect(page.locator("main [role=status]")).toContainText("stopped");
  await signIn(context);
  await page.goto("/admin/audience");
  await expect(
    page.getByText("interest@example.invalid", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".audience-row .order-status")).toHaveText(
    "unsubscribed",
  );
  expect((await request.post("/api/internal/email-worker")).status()).toBe(401);
  await page.goto("/admin/readiness");
  await expect(
    page.getByRole("heading", { name: "Launch readiness", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Disabled / credentials required", { exact: true }),
  ).toBeVisible();
});
