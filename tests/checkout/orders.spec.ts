import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const owner = "c0d00000-0000-4000-8000-000000000001",
  customer = "c0d00000-0000-4000-8000-000000000002",
  other = "c0d00000-0000-4000-8000-000000000003";
async function signIn(context: BrowserContext, sub = customer) {
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
async function fillAddress(page: Page) {
  await page.getByLabel("Full name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page
    .getByLabel("Street address", { exact: true })
    .fill("Test Street 12");
  await page.getByLabel("City", { exact: true }).fill("Lahore");
  await page.getByLabel("Province or region").fill("Punjab");
}
test.beforeEach(async ({ request }) => {
  await request.post("http://127.0.0.1:54328/test/reset");
});

test("two customer requests contend for the final unit without overselling", async ({
  browser,
  request,
}) => {
  await request.post("http://127.0.0.1:54328/test/last-unit");
  const a = await browser.newContext(),
    b = await browser.newContext();
  const headers = { Origin: "http://localhost:3101" };
  const items = [{ productId: "checkout-hoodie", size: "M", quantity: 1 }];
  const address = {
    recipient: "Race Fixture",
    phone: "03001234567",
    line1: "Test Street",
    city: "Lahore",
    province: "Punjab",
    country: "PK",
  };
  try {
    await signIn(a, customer);
    await signIn(b, other);
    const quotes = await Promise.all(
      [a, b].map(
        async (c) =>
          (
            await (
              await c.request.post("http://localhost:3101/api/checkout/quote", {
                headers,
                data: { items },
              })
            ).json()
          ).quote,
      ),
    );
    const results = await Promise.all(
      [a, b].map((c, i) =>
        c.request.post("http://localhost:3101/api/orders", {
          headers,
          data: {
            customerId: i ? other : customer,
            requestId: crypto.randomUUID(),
            items,
            address,
            quote: quotes[i],
          },
        }),
      ),
    );
    expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
    const state = await (
      await request.get("http://127.0.0.1:54328/test/state")
    ).json();
    expect(state.orders).toHaveLength(1);
    expect(
      state.products.find((p: { id: string }) => p.id === "checkout-hoodie")
        .sizes[0].stock,
    ).toBe(0);
  } finally {
    await a.close();
    await b.close();
  }
});

test("owner can rehearse checkout while public orders stay closed", async ({
  page,
  context,
  request,
}) => {
  await request.post("http://127.0.0.1:54328/test/owner-test-order");
  await signIn(context, owner);
  await page.goto("/admin/orders");
  await page.getByRole("link", { name: "Start a test order" }).click();
  await expect(
    page.getByRole("heading", { name: "Checkout Test Set", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sign in with any store account to try checkout.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page
      .locator(".product-info [role=status]")
      .filter({ hasText: "Added to your bag." }),
  ).toBeVisible();
  await page.goto("/checkout");
  await expect(
    page.getByRole("button", { name: "Place test order", exact: true }),
  ).toBeEnabled();
  await expect(page.getByText("PKR 7,250", { exact: true })).toBeVisible();
  await fillAddress(page);
  await page
    .getByRole("button", { name: "Place test order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test order received." }),
  ).toBeVisible();
  const receiptPath = await page
    .getByRole("link", { name: "View your order" })
    .getAttribute("href");
  await page.goto(receiptPath!.replace("/account/", "/admin/"));
  await expect(
    page.getByText("Test order. All statuses", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mark confirmed", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "This changes a test order only.",
  );
  await page
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mark shipped", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel order", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click();
  await expect(
    page.getByText("This order is complete.", { exact: false }),
  ).toBeVisible();
  await page.goto("/account/orders");
  await expect(
    page.getByText("Test order · no dispatch", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/orders");
  await expect(
    page.getByText("Public ordering is closed.", { exact: false }),
  ).toBeVisible();
});

test("ordinary customer places a private test order while public checkout is closed", async ({
  page,
  context,
  request,
}) => {
  await request.post("http://127.0.0.1:54328/test/owner-test-order");
  expect(
    (
      await request.post("/api/checkout/quote", {
        data: {},
        headers: { Origin: "http://localhost:3101" },
      })
    ).status(),
  ).toBe(401);
  await signIn(context, customer);
  await page.goto("/product/navy-hoodie-trouser-set");
  await page
    .getByRole("link", { name: "Try test checkout", exact: true })
    .click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page
      .locator(".product-info [role=status]")
      .filter({ hasText: "Added to your bag." }),
  ).toBeVisible();
  await page.goto("/checkout");
  await expect(
    page.getByRole("button", { name: "Place test order", exact: true }),
  ).toBeEnabled();
  await fillAddress(page);
  await page
    .getByRole("button", { name: "Place test order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test order received." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Manage this test order" }),
  ).toHaveCount(0);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        /\/api\/orders\/[a-f0-9-]{36}$/.test(response.url()) &&
        response.status() === 200,
    ),
    page.getByRole("link", { name: "View your order" }).click(),
  ]);
  await expect(
    page.getByText("Test order. All statuses", { exact: false }),
  ).toBeVisible();
  expect((await context.request.get("/api/admin/orders")).status()).toBe(403);
  await signIn(context, other);
  expect(
    (
      await context.request.get(`/api/orders/${page.url().split("/").pop()}`)
    ).status(),
  ).toBe(404);
});
test("owner controls launch explicitly and stale updates are rejected", async ({
  page,
  context,
  request,
}) => {
  await request.post("http://127.0.0.1:54328/test/close");
  await signIn(context, owner);
  await page.goto("/admin/orders");
  await expect(
    page.getByText("Public ordering is closed.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Accept public orders").check();
  await page
    .getByRole("button", { name: "Save checkout settings", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep closed", exact: true }).click();
  const before = await (
    await context.request.get("/api/admin/checkout-settings")
  ).json();
  expect(before.settings.enabled).toBe(false);
  await page
    .getByRole("button", { name: "Save checkout settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open ordering", exact: true })
    .click();
  await expect(
    page.getByText("Public ordering is open.", { exact: false }),
  ).toBeVisible();
  const stale = await context.request.patch("/api/admin/checkout-settings", {
    data: {
      enabled: false,
      shipping: "250",
      updatedAt: before.settings.updated_at,
    },
    headers: { Origin: "http://localhost:3101" },
  });
  expect(stale.status()).toBe(409);
  await signIn(context, customer);
  const items = [{ productId: "checkout-hoodie", size: "M", quantity: 1 }];
  const headers = { Origin: "http://localhost:3101" };
  const quote = await (
    await context.request.post("/api/checkout/quote", {
      data: { items },
      headers,
    })
  ).json();
  const response = await context.request.post("/api/orders", {
    data: {
      customerId: customer,
      requestId: crypto.randomUUID(),
      items,
      quote: quote.quote,
      address: {
        recipient: "Test Customer",
        phone: "03001234567",
        line1: "Test Street",
        city: "Lahore",
        province: "Punjab",
        country: "PK",
      },
    },
    headers,
  });
  expect(response.status()).toBe(200);
  const { id } = await response.json();
  await signIn(context, owner);
  const detail = await (
    await context.request.get(`/api/admin/orders/${id}`)
  ).json();
  const payload = {
    updatedAt: detail.order.updated_at,
    status: "confirmed",
    courier: "",
    tracking: "",
  };
  expect(
    (
      await context.request.patch(`/api/admin/orders/${id}`, {
        data: payload,
        headers,
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await context.request.patch(`/api/admin/orders/${id}`, {
        data: { ...payload, status: "cancelled" },
        headers,
      })
    ).status(),
  ).toBe(409);
  expect(
    (await (await context.request.get(`/api/admin/orders/${id}`)).json()).order
      .status,
  ).toBe("confirmed");
});
test("checkout is protected; customer orders, sees receipt and private history", async ({
  page,
  context,
  request,
}) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
  expect(
    (
      await request.post("/api/orders", {
        data: {},
        headers: { Origin: "http://localhost:3101" },
      })
    ).status(),
  ).toBe(401);
  await signIn(context);
  await page.goto("/checkout");
  await expect(page.getByText("PKR 7,250", { exact: true })).toBeVisible();
  await fillAddress(page);
  await page.screenshot({
    path: ".tools/checkout-desktop.png",
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page }).include("main").analyze()
    ).violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Place order · cash on delivery" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Order received." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View your order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Delivery address", exact: true }),
  ).toBeVisible();
  await expect(page.locator("address")).toContainText("Test Street 12");
  await expect(page.locator(".order-status")).toHaveText("Pending");
  await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]{36}$/);
  const id = page.url().split("/").pop()!;
  await signIn(context, other);
  expect((await context.request.get(`/api/orders/${id}`)).status()).toBe(404);
  expect((await context.request.get(`/api/admin/orders/${id}`)).status()).toBe(
    403,
  );
  const state = await (
    await request.get("http://127.0.0.1:54328/test/state")
  ).json();
  expect(state.orders).toHaveLength(1);
  expect(
    state.products.find((p: { id: string }) => p.id === "checkout-hoodie")
      .sizes[0].stock,
  ).toBe(2);
});
test("lost response survives reload and retries the same order once", async ({
  page,
  context,
  request,
}) => {
  await signIn(context);
  await page.goto("/checkout");
  await expect(page.getByText("PKR 7,250", { exact: true })).toBeVisible();
  await fillAddress(page);
  await request.post("http://127.0.0.1:54328/test/fail-after-commit");
  await page
    .getByRole("button", { name: "Place order · cash on delivery" })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry the same order" }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Retry the same order" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Retry the same order" }).click();
  await expect(
    page.getByRole("heading", { name: "Order received." }),
  ).toBeVisible();
  const state = await (
    await request.get("http://127.0.0.1:54328/test/state")
  ).json();
  expect(state.orders).toHaveLength(1);
  expect(
    state.products.find((p: { id: string }) => p.id === "checkout-hoodie")
      .sizes[0].stock,
  ).toBe(2);
});
test("owner confirms, ships with tracking and records collected cash", async ({
  page,
  context,
}) => {
  await signIn(context);
  await page.goto("/checkout");
  await expect(page.getByText("PKR 7,250", { exact: true })).toBeVisible();
  await fillAddress(page);
  await page
    .getByRole("button", { name: "Place order · cash on delivery" })
    .click();
  await page
    .getByRole("link", { name: "View your order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]{36}$/);
  const id = page.url().split("/").pop()!;
  await signIn(context, owner);
  await page.goto(`/admin/orders/${id}`);
  await page
    .getByRole("button", { name: "Mark confirmed", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click();
  await expect(page.locator(".order-status")).toHaveText("Confirmed");
  await page.getByLabel("Courier name").fill("Test courier");
  await page.getByLabel("Tracking reference").fill("TRACK-123");
  await page.getByRole("button", { name: "Mark shipped", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click();
  await expect(page.locator(".order-status")).toHaveText("Shipped");
  await page
    .getByRole("button", { name: "Mark delivered", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("cash collection");
  await page
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click();
  await expect(page.locator(".order-status")).toHaveText("Delivered");
  await expect(
    page.getByText("Cash collected on delivery", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".order-timeline li")).toHaveCount(4);
});
test("closed checkout and stale prices cannot create an order; foreign writes rejected", async ({
  page,
  context,
  request,
}) => {
  await signIn(context);
  await page.goto("/checkout");
  await expect(page.getByText("PKR 7,250", { exact: true })).toBeVisible();
  await fillAddress(page);
  await request.post("http://127.0.0.1:54328/test/price");
  await page
    .getByRole("button", { name: "Place order · cash on delivery" })
    .click();
  await expect(page.getByText("PKR 7,350", { exact: true })).toBeVisible();
  expect(
    (
      await context.request.post("/api/checkout/quote", {
        data: { items: [{ productId: "demo-tee", size: "M", quantity: 1 }] },
        headers: { Origin: "http://localhost:3101" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await context.request.post("/api/orders", {
        data: {},
        headers: { Origin: "https://foreign.invalid" },
      })
    ).status(),
  ).toBe(400);
  await request.post("http://127.0.0.1:54328/test/close");
  await page.reload();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Ordering has not opened",
  );
  await expect(
    page.getByRole("button", { name: "Place order · cash on delivery" }),
  ).toBeDisabled();
  expect(
    (await (await request.get("http://127.0.0.1:54328/test/state")).json())
      .orders,
  ).toHaveLength(0);
});
test("mobile checkout fits and owner cancellation restores stock once", async ({
  page,
  context,
  request,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(context);
  await page.goto("/checkout");
  await expect(page.getByText("PKR 7,250", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fillAddress(page);
  await page.screenshot({ path: ".tools/checkout-mobile.png", fullPage: true });
  await page
    .getByRole("button", { name: "Place order · cash on delivery" })
    .click();
  await page
    .getByRole("link", { name: "View your order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]{36}$/);
  const id = page.url().split("/").pop()!;
  await signIn(context, owner);
  await page.goto(`/admin/orders/${id}`);
  await page.getByRole("button", { name: "Cancel order", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm status change", exact: true })
    .click();
  await expect(page.locator(".order-status")).toHaveText("Cancelled");
  const state = await (
    await request.get("http://127.0.0.1:54328/test/state")
  ).json();
  expect(
    state.products.find((p: { id: string }) => p.id === "checkout-hoodie")
      .sizes[0].stock,
  ).toBe(3);
  await page.goto("/admin/orders");
  await expect(
    page.getByText("Public ordering is open.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Order status", exact: true })
    .selectOption("cancelled");
  await expect(page.locator(".order-rows li")).toHaveCount(1);
});
