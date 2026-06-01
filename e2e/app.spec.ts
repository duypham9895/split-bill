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

/** Scroll to bottom of page to ensure expense list is visible on mobile. */
async function scrollToExpenseList(page: import("@playwright/test").Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
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

  const editBtn = page.getByRole("button", { name: "Edit Seafood dinner" });
  await editBtn.scrollIntoViewIfNeeded();
  await editBtn.click();
  await expect(page.locator("h1", { hasText: "Edit expense" })).toBeVisible();

  await page.getByLabel("Title").fill("Edited seafood dinner");
  await page.getByLabel("Amount (VND)").fill("1600000");
  await page.getByRole("button", { name: "Save changes" }).click();

  await scrollToExpenseList(page);
  await expect(page.getByText("Edited seafood dinner")).toBeVisible();
  await expect(page.getByText(/^Seafood dinner$/)).not.toBeVisible();
});

test("host can remove an existing expense", async ({ page }) => {
  await page.goto("/");

  await scrollToExpenseList(page);
  await expect(page.getByText(/^Airport taxi$/)).toBeVisible();

  const deleteBtn = page.getByRole("button", { name: "Delete Airport taxi" });
  await deleteBtn.scrollIntoViewIfNeeded();
  await deleteBtn.click();

  // Confirm deletion in the dialog
  const confirmBtn = page.locator(".confirmDialog .primaryButton");
  await confirmBtn.waitFor({ state: "visible" });
  await confirmBtn.click();

  await scrollToExpenseList(page);
  await expect(page.getByText(/^Airport taxi$/)).not.toBeVisible();
  await expect(page.getByText(/^Seafood dinner$/)).toBeVisible();
  await expect(page.getByText(/^Hotel deposit$/)).toBeVisible();
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
  // Payment profiles are at the bottom of the Share section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText("VietinBank · 123123123")).toBeVisible({ timeout: 10000 });
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
  await expect(page.getByRole("img", { name: "Payment to Duy" })).toBeVisible();
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
