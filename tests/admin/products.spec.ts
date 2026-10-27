import { expect, test, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const owner = "b0a00000-0000-4000-8000-000000000001";
async function signIn(context: BrowserContext, uid = owner) {
  const payload = {
    sub: uid,
    aal: uid === owner ? "aal2" : "aal1",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    iss: "http://127.0.0.1:54329/auth/v1",
    role: "authenticated",
  };
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${Buffer.from("fixture-signature").toString("base64url")}`;
  const session = {
    access_token: token,
    refresh_token: "fixture-refresh",
    expires_at: payload.exp,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: uid,
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
test.beforeEach(async ({ request, context }) => {
  await request.post("http://127.0.0.1:54329/test/reset");
  // Real Next image optimization rejects private IPs. Serve fixture images
  // directly in this isolated browser test; keep the application's SSRF guard.
  await context.route("**/_next/image**", async (route) => {
    const src = new URL(route.request().url()).searchParams.get("url");
    if (src?.startsWith("http://127.0.0.1:54329/storage/"))
      await route.fulfill({ response: await context.request.get(src) });
    else await route.continue();
  });
});
test("anonymous users and customers cannot manage products", async ({
  page,
  context,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/admin/products/new");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("next"))
    .toBe("/admin/products/new");
  expect((await request.get("/api/admin/products")).status()).toBe(401);
  await signIn(context, "b0a00000-0000-4000-8000-000000000002");
  await page.goto("/admin");
  await expect(page.locator("main [role=alert]")).toContainText(
    "does not have owner access",
  );
  expect((await context.request.get("/api/admin/products")).status()).toBe(403);
  expect((await context.request.post("/api/admin/uploads")).status()).toBe(403);
});
test("owner creates a private draft, uploads photos, publishes, edits stock and unpublishes", async ({
  page,
  context,
}) => {
  await signIn(context);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Ready when you are." }),
  ).toBeVisible();
  await expect(page.locator(".site-header")).toHaveCount(0);
  await page.getByRole("link", { name: "Add a product" }).click();
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Owner test hoodie");
  await page.getByLabel("URL slug").fill("owner-test-hoodie");
  await page.getByLabel("Subtitle").fill("Everyday pullover");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A navy hoodie prepared as an owner test draft.");
  await page.getByLabel("Selling price").fill("7000");
  await page.getByLabel("Color name").fill("Navy");
  await page.getByLabel("Stock 1", { exact: true }).fill("3");
  await page
    .getByLabel("Add photos")
    .setInputFiles("products/hoodieblue1.jpeg");
  await expect(page.getByLabel("Photo 1 description")).toBeVisible();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]+$/, {
    timeout: 20000,
  });
  await page.reload();
  await expect(page.getByLabel("Selling price")).toHaveValue("7000.00");
  const productUrl = "/product/owner-test-hoodie";
  const draftResponse = await page.request.get(productUrl);
  expect([200, 404]).toContain(draftResponse.status());
  expect(await draftResponse.text()).toContain("A DIFFERENT DIRECTION.");
  await page
    .getByRole("button", { name: "Publish product", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm publish", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Product published." }),
  ).toBeVisible();
  await expect(page.getByLabel("URL slug")).toHaveAttribute("readonly", "");
  const id = page.url().split("/").pop()!;
  const otherPage = await context.newPage();
  await otherPage.goto(productUrl);
  await expect(otherPage.getByRole("heading", { level: 1 })).toHaveText(
    "Owner test hoodie",
  );
  await expect(
    otherPage.locator(".product-info").getByText("PKR 7,000", { exact: true }),
  ).toBeVisible();
  await otherPage.close();
  await page.getByLabel("Stock 1", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "Save live changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm live changes" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Product published." }),
  ).toBeVisible();
  expect(
    (await (await context.request.get(`/api/admin/products/${id}`)).json())
      .product.sizes[0].stock,
  ).toBe(5);
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  await page.screenshot({
    path: ".tools/admin-editor-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".tools/admin-editor-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Unpublish product", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm unpublish" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Draft saved." }),
  ).toBeVisible();
  const unpublished = await page.request.get(productUrl);
  expect([200, 404]).toContain(unpublished.status());
  expect(await unpublished.text()).toContain("A DIFFERENT DIRECTION.");
});
test("stale saves preserve edits and require reloading confirmed data", async ({
  context,
  page,
  request,
}) => {
  await signIn(context);
  await page.goto("/admin/products/fixture-tee");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Unsaved owner edits");
  await request.post("http://127.0.0.1:54329/test/change?id=fixture-tee");
  await page
    .getByRole("button", { name: "Save live changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm live changes" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "changed in another session",
  );
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    "Unsaved owner edits",
  );
  await expect(
    page.getByRole("button", { name: "Save live changes", exact: true }),
  ).toBeDisabled();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reload saved product" }).click();
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    "Fixture tee",
  );
});
test("API rejects foreign origins and unsupported uploaded file content", async ({
  context,
}) => {
  await signIn(context);
  const foreign = await context.request.post("/api/admin/products", {
    headers: { Origin: "https://evil.example" },
    data: {},
  });
  expect(foreign.status()).toBe(400);
  const invalid = await context.request.post("/api/admin/uploads", {
    headers: { Origin: "http://localhost:3100" },
    multipart: {
      file: {
        name: "fake.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("not an image"),
      },
    },
  });
  expect(invalid.status()).toBe(400);
});

test("unconfirmed saves keep edits and prevent a blind retry", async ({
  context,
  page,
  request,
}) => {
  await signIn(context);
  await page.goto("/admin/products/fixture-tee");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Keep these edits");
  await request.post("http://127.0.0.1:54329/test/fail-next");
  await page
    .getByRole("button", { name: "Save live changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm live changes" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not be confirmed",
  );
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    "Keep these edits",
  );
  await expect(
    page.getByRole("button", { name: "Save live changes", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "Product published." }),
  ).toHaveCount(0);
});

test("unsaved navigation can be cancelled and product filters work", async ({
  context,
  page,
}) => {
  await signIn(context);
  await page.goto("/admin/products/fixture-tee");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Unsaved details");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "All products", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products\/fixture-tee$/);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: "All products", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Products", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("draft");
  await expect(
    page.getByRole("heading", { name: "No matching products." }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("all");
  await page.getByLabel("Search products").fill("Fixture");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Fixture tee", exact: true }),
  ).toBeVisible();
});
