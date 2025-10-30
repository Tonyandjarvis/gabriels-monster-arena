import { test, expect } from '@playwright/test';

test('wave progression', async ({ page }) {
  await page.goto('/');
  await page.click('[data-test=start-wave-button]');
  await page.waitForTimeout(10000); // Wait for wave to complete
  const waveNumber = await page.evaluate(() => window.gameEngine.waveSystem.currentWave);
  expect(waveNumber).toBe(2);
});
