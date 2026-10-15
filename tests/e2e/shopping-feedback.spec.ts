import { expect, test, type Page, type Route } from "@playwright/test";

const empty = { bag: [], favorites: [] };
const oneItem = {
  bag: [{ productId: "pace-01-men", size: "10", quantity: 1 }],
  favorites: [],
};
function gate() {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { wait, release };
}
async function account(
  page: Page,
  mutate: (route: Route, action: string) => Promise<void>,
  initial: unknown = empty,
) {
  await page.route("**/api/account/session", (route) =>
    route.fulfill({
      json: {
        user: { id: "feedback-test-user", email: "feedback@example.invalid" },
      },
    }),
  );
  await page.route("**/api/account/store", (route) => {
    const { action } = route.request().postDataJSON();
    return action === "read" || action === "merge"
      ? route.fulfill({ json: initial })
      : mutate(route, action);
  });
}
async function chooseSize(page: Page) {
  await page.goto("/product/pace-01-men");
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "10", exact: true }).click();
}

test("bag loading prevents premature adds without reporting a stock error", async ({
  page,
}) => {
  const session = gate();
  await page.route("**/api/account/session", async (route) => {
    await session.wait;
    await route.fulfill({ json: { user: null } });
  });
  try {
    await page.goto("/product/pace-01-men");
    await expect(
      page.getByText("Loading your bag…", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add to bag", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "10", exact: true }).click();
    await expect(page.locator("#size-error")).toHaveCount(0);
    session.release();
    await expect(
      page.getByRole("button", { name: "Add to bag", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "View bag", exact: true }),
    ).toBeVisible();
  } finally {
    session.release();
  }
});

test("account add shows success and changes the bag only after acknowledgement", async ({
  page,
}) => {
  const save = gate();
  let writes = 0;
  await account(page, async (route) => {
    ++writes;
    await save.wait;
    await route.fulfill({ json: oneItem });
  });
  try {
    await chooseSize(page);
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Adding…", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Favorite", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("link", { name: "Bag, 0 items", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View bag", exact: true }),
    ).toHaveCount(0);
    expect(writes).toBe(1);
    save.release();
    await expect(
      page.getByRole("link", { name: "View bag", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Bag, 1 items", exact: true }),
    ).toBeVisible();
    expect(writes).toBe(1);
  } finally {
    save.release();
  }
});

test("failed account save keeps the bag unchanged and can recover through retry", async ({
  page,
}) => {
  let writes = 0;
  await account(page, async (route) => {
    ++writes;
    await route.fulfill(
      writes === 1
        ? { status: 503, json: { error: "Service unavailable" } }
        : { json: oneItem },
    );
  });
  await chooseSize(page);
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.locator("#size-error")).toContainText(
    "Could not confirm this change was saved",
  );
  await expect(page.locator("#size-error")).not.toContainText(
    "available quantity",
  );
  await expect(
    page.getByRole("link", { name: "View bag", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Bag, 0 items", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry syncing" }).click();
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View bag", exact: true }),
  ).toBeVisible();
});

for (const failure of [
  {
    name: "expired session",
    status: 401,
    code: "session",
    message: "Your session has expired",
  },
  {
    name: "changed stock",
    status: 409,
    code: "stock_limit",
    message: "That size or quantity is no longer available",
  },
])
  test(`${failure.name} produces specific feedback without success`, async ({
    page,
  }) => {
    await account(page, (route) =>
      route.fulfill({ status: failure.status, json: { code: failure.code } }),
    );
    await chooseSize(page);
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
    await expect(page.locator("#size-error")).toContainText(failure.message);
    await expect(
      page.getByRole("link", { name: "View bag", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Bag, 0 items", exact: true }),
    ).toBeVisible();
  });

test("browser storage failure is not described as a stock limit", async ({
  page,
}) => {
  await page.route("**/api/account/session", (route) =>
    route.fulfill({ json: { user: null } }),
  );
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "QuotaExceededError");
    };
  });
  await chooseSize(page);
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.locator("#size-error")).toContainText(
    "Allow local storage and try again",
  );
  await expect(
    page.getByRole("link", { name: "View bag", exact: true }),
  ).toHaveCount(0);
});

test("a genuine guest stock limit keeps its accurate message", async ({
  page,
}) => {
  await page.route("**/api/account/session", (route) =>
    route.fulfill({ json: { user: null } }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "stride-store-v1",
      JSON.stringify({
        bag: [{ productId: "pace-01-men", size: "10", quantity: 8 }],
        favorites: [],
      }),
    ),
  );
  await chooseSize(page);
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.locator("#size-error")).toHaveText(
    "Your bag already contains the available quantity for this size.",
  );
  await expect(
    page.getByRole("link", { name: "Bag, 8 items", exact: true }),
  ).toBeVisible();
});

test("failed quantity changes retain the last confirmed account bag", async ({
  page,
}) => {
  const save = gate();
  await account(
    page,
    async (route) => {
      await save.wait;
      await route.fulfill({ status: 503, json: { error: "Save failed" } });
    },
    oneItem,
  );
  try {
    await page.goto("/cart");
    await expect(page.locator(".bag-quantity span")).toHaveText("1");
    await expect(page.locator(".bag-summary")).toContainText(
      "syncs across devices",
    );
    await page
      .getByRole("button", { name: "Increase Pace 01 quantity" })
      .click();
    await expect(
      page.getByText("Saving your changes…", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".bag-quantity span")).toHaveText("1");
    await expect(
      page.getByRole("button", { name: "Increase Pace 01 quantity" }),
    ).toBeDisabled();
    save.release();
    await expect(page.locator(".account-sync-error")).toContainText(
      "Could not confirm this change was saved",
    );
    await expect(page.locator(".bag-quantity span")).toHaveText("1");
  } finally {
    save.release();
  }
});
