import { test, expect } from '@playwright/test';

test('combat flow', async ({ page }) {
  await page.goto('/');
  await page.click('[data-test=monster-button]');
  await page.click('canvas', { position: { x: 200, y: 300 } });
  await page.click('[data-test=start-wave-button]');
  await page.waitForTimeout(5000);
  const currency = await page.evaluate(() => window.gameEngine.uiSystem.getGameStats().currency);
  expect(currency).toBeGreaterThan(0);
});
