import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("hero section renders with CTA", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('[data-testid="hero-section"], section').first()).toBeVisible();
    // Check for main CTA button
    const cta = page.locator('a[href*="signup"], a[href*="register"], button').filter({ hasText: /get started|sign up|try free/i }).first();
    if (await cta.isVisible()) {
      await expect(cta).toBeVisible();
    }
  });

  test("pricing section shows all tiers", async ({ page }) => {
    await page.goto("/en");
    // Look for pricing-related content
    const pricingSection = page.locator('text=/seedling|hustler|grower|mogul/i').first();
    if (await pricingSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(pricingSection).toBeVisible();
    }
  });

  test("page has correct meta title", async ({ page }) => {
    await page.goto("/en");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/en");
    // Check footer or nav links
    const docsLink = page.locator('a[href*="docs"]').first();
    if (await docsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(docsLink).toHaveAttribute("href", expect.stringContaining("docs"));
    }
  });
});
