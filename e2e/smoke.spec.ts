import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app loads and returns a valid response', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
  });

  test('page has a title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
