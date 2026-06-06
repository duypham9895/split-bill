import { expect, test } from "@playwright/test";

function encodeTripSharePayload(trip: unknown) {
  return encodeURIComponent(
    Buffer.from(JSON.stringify({ version: 1, exportedAt: "2026-06-01T00:00:00.000Z", trip })).toString(
      "base64",
    ),
  );
}

/** Click a nav button by section text. Works on both desktop sidebar and mobile bottom nav. */
async function clickNav(page: import("@playwright/test").Page, text: string) {
  const sidebarBtn = page.locator(".sideNav button", { hasText: text });
  if (await sidebarBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await sidebarBtn.click();
  } else {
    await page.locator(".bottomNav button", { hasText: text }).click();
  }
}

/** Scroll a selector into view using JS (more reliable on mobile). */
async function scrollTo(page: import("@playwright/test").Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
  }, selector);
  await page.waitForTimeout(300);
}

test("host can review expenses, balances, settlement, and sharing sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Expenses", exact: true })).toBeVisible();
  await expect(page.getByText("Formula preview")).toBeVisible();

  await clickNav(page, "Settle");
  await expect(page.locator("h1", { hasText: "Settle" })).toBeVisible();
  await expect(page.getByText("Simplified")).toBeVisible();
  await expect(page.getByText("Direct payback")).toBeVisible();

  await clickNav(page, "Share");
  await expect(page.getByRole("heading", { name: "Share", exact: true })).toBeVisible();
  await expect(page.getByText("Export JSON")).toBeVisible();
  await expect(page.getByText("Export CSV")).toBeVisible();
});

test("host can edit an existing expense without duplicating it", async ({ page }) => {
  await page.goto("/");

  await scrollTo(page, ".expenseList");
  const editBtn = page.getByRole("button", { name: "Edit Seafood dinner" });
  await editBtn.click();
  await expect(page.locator("h1", { hasText: "Edit expense" })).toBeVisible();

  await page.getByLabel("Title").fill("Edited seafood dinner");
  await page.getByLabel("Amount (VND)").fill("1600000");
  await page.getByRole("button", { name: "Save changes" }).click();

  await scrollTo(page, ".expenseList");
  // Use the expense list specifically to avoid matching QuickAdd chips with the same title.
  await expect(page.locator(".expenseList strong", { hasText: "Edited seafood dinner" })).toBeAttached();
  await expect(page.locator(".expenseList strong", { hasText: /^Seafood dinner$/ })).not.toBeAttached();
});

test("host can remove an existing expense", async ({ page }) => {
  await page.goto("/");

  await scrollTo(page, ".expenseList");
  // Use the expense list specifically to avoid matching QuickAdd chips with the same title.
  await expect(page.locator(".expenseList strong", { hasText: /^Airport taxi$/ })).toBeAttached();

  const deleteBtn = page.getByRole("button", { name: "Delete Airport taxi" });
  await deleteBtn.click();

  // Confirm deletion in the dialog
  const confirmBtn = page.locator(".confirmDialog .primaryButton");
  await confirmBtn.waitFor({ state: "visible" });
  await confirmBtn.click();

  await scrollTo(page, ".expenseList");
  await expect(page.locator(".expenseList strong", { hasText: /^Airport taxi$/ })).not.toBeAttached();
  await expect(page.locator(".expenseList strong", { hasText: /^Seafood dinner$/ })).toBeAttached();
  await expect(page.locator(".expenseList strong", { hasText: /^Hotel deposit$/ })).toBeAttached();
});

test("host can edit bank payment info for an existing member", async ({ page }) => {
  await page.goto("/");

  await clickNav(page, "Trip");
  await page.getByRole("button", { name: "Edit Duy" }).click();

  await expect(page.locator("h1", { hasText: "Edit member" })).toBeVisible();
  await page.getByRole("textbox", { name: "Bank", exact: true }).fill("VietinBank");
  await page.getByRole("textbox", { name: "Bank code" }).fill("970415");
  await page.getByRole("textbox", { name: "Account number" }).fill("123123123");
  await page.getByRole("textbox", { name: "Account holder" }).fill("DUY UPDATED");
  await page.getByRole("button", { name: "Save member" }).click();

  await expect(page.locator("h1", { hasText: "Trip" })).toBeVisible();

  await clickNav(page, "Share");
  await scrollTo(page, ".shareSummary");
  await expect(page.getByText("VietinBank · 123123123")).toBeAttached();
});

test("host can upload a payment QR image for each member", async ({ page }) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l2rMcwAAAABJRU5ErkJggg==",
    "base64",
  );

  await page.goto("/");
  await clickNav(page, "Trip");
  await page.getByRole("button", { name: "Edit Duy" }).click();
  await page.getByLabel("Payment QR image").setInputFiles({
    name: "duy-qr.png",
    mimeType: "image/png",
    buffer: png,
  });

  await expect(page.getByRole("img", { name: "Uploaded payment QR preview" })).toBeVisible();
  await page.getByRole("button", { name: "Save member" }).click();

  await clickNav(page, "Share");
  await scrollTo(page, ".shareSummary");
  await expect(page.getByRole("img", { name: "Payment to Duy" })).toBeAttached();
});

test("shared trip links load the encoded trip payload", async ({ page }) => {
  const payload = encodeTripSharePayload({
    id: "shared-trip",
    name: "Shared Link Trip",
    currency: "VND",
    language: "en",
    members: [{ id: "duy", name: "Duy", active: true }],
    expenses: [],
    transfers: [],
  });

  await page.goto(`/?trip=${payload}`);

  await expect(page.getByRole("combobox", { name: "Active trip" })).toHaveValue("shared-trip");
  await expect(page.locator(".topbar")).toContainText("Shared Link Trip");
  await clickNav(page, "Trip");
  await expect(page.locator(".listPanel strong", { hasText: "Duy" })).toBeVisible();
});

test("view=share link opens the read-only friend view with a who-are-you picker", async ({ page }) => {
  const payload = encodeTripSharePayload({
    id: "share-view-trip",
    name: "Beach Weekend",
    currency: "VND",
    language: "en",
    members: [
      { id: "duy", name: "Duy", active: true },
      { id: "an", name: "An", active: true },
    ],
    expenses: [
      {
        id: "e1",
        title: "Dinner",
        amountMinor: 200000,
        splitMethod: "equal",
        date: "2026-06-01",
        payers: [{ memberId: "duy", amountMinor: 200000 }],
        participants: [{ memberId: "duy" }, { memberId: "an" }],
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    ],
    transfers: [],
  });

  await page.goto(`/?trip=${payload}&view=share`);

  // The editor chrome must NOT render in share view.
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Who are you?" })).toBeVisible();

  // An owes their half of the dinner.
  await page.getByRole("button", { name: "An" }).click();
  await expect(page.getByText("You owe")).toBeVisible();
  await expect(page.getByText("100,000 VND").first()).toBeVisible();
});
