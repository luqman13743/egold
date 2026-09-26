import { test, expect } from "@playwright/test";

test.describe("Authorization", () => {
  test("anonymous visitor is redirected away from /admin", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("anonymous visitor is redirected away from /account", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logged-in customer cannot reach the admin dashboard", async ({ page }) => {
    // Requires a seeded customer account (see scripts/seed.ts).
    await page.goto("/login");
    await page.getByLabel("Email").fill("customer@example.com");
    await page.getByLabel("Password").fill("ChangeMeToo123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/account/);

    // The layout's requireRole("staff") check is the actual boundary here —
    // this test is asserting that boundary holds, not just that a nav
    // link is hidden.
    await page.goto("/admin/dashboard");
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });
});
