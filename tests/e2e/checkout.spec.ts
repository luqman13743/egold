import { test, expect } from "@playwright/test";

// This suite assumes the seed script has been run against the test
// database (see SETUP.md) so at least one published, in-stock product
// exists. It exercises Cash on Delivery end-to-end since that path
// doesn't depend on an external gateway being reachable from CI; the
// Safepay path is covered separately by webhook-level tests, since a
// real hosted-checkout redirect can't be driven headlessly without a
// live Safepay sandbox session.
test.describe("Checkout flow", () => {
  test("guest can add a product to cart and place a COD order", async ({ page }) => {
    await page.goto("/shop");

    // Open the first available product.
    const firstProduct = page.locator("a[href^='/product/']").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const addToCart = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCart).toBeEnabled();
    await addToCart.click();
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("link", { name: /checkout/i })).toBeVisible();
    await page.getByRole("link", { name: /checkout/i }).click();

    await expect(page).toHaveURL(/\/checkout/);

    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByLabel("Phone").fill("03001234567");
    await page.getByLabel("Address").fill("123 Test Street");
    await page.getByLabel("City").fill("Lahore");

    await page.getByLabel(/cash on delivery/i).check();

    await page.getByRole("button", { name: /place order/i }).click();

    // Server always revalidates stock/price and only redirects on success —
    // reaching the confirmation page means the order was actually created.
    await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/);
    await expect(page.getByRole("heading", { name: /order placed/i })).toBeVisible();
  });

  test("checkout rejects a payment method that isn't offered", async ({ request }) => {
    // Direct action invocation isn't possible from Playwright (Server
    // Actions aren't a public HTTP endpoint), so this is verified at the
    // unit level in tests/unit/validation.test.ts instead — noted here so
    // the coverage mapping in SETUP.md stays accurate.
    test.skip(true, "Covered by schema-level unit test — Server Actions have no public HTTP surface to hit directly.");
  });
});
