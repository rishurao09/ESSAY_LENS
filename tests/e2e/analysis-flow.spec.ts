/**
 * E2E tests for the analysis flow
 */

import { test, expect } from '@playwright/test';

const SAMPLE_ESSAY = `I remember the exact moment when everything changed. My hands were shaking as I held the letter.
The words blurred together on the page, but one phrase stood out: congratulations.

Years of practice had led to this moment. Not just the robotics club, but the late nights debugging code,
the competitions where I failed, the mentors who believed in me when I didn't believe in myself.

Building machines taught me something about myself. When a robot falls, you don't blame the machine.
You examine the system. You ask what assumption was wrong. This kind of thinking changed how I approach every problem.

I want to bring this mindset to college — the habit of examining assumptions, of being wrong with curiosity rather than shame.`;

test.describe('Analysis Flow', () => {
  test('user can analyze an essay end-to-end', async ({ page }) => {
    await page.goto('/');

    // Find the essay textarea
    const textarea = page.locator('#essay-input');
    await expect(textarea).toBeVisible();

    // Paste the essay
    await textarea.fill(SAMPLE_ESSAY);

    // Check word count updates
    await expect(page.locator('text=/\\d+ words/')).toBeVisible();

    // Click analyze
    const analyzeButton = page.locator('#analyze-button');
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // Should show loading state
    await expect(page.locator('text=/Analyzing essay/i')).toBeVisible();

    // Wait for results (up to 30s)
    await expect(page.locator('text=/Overall Assessment/i')).toBeVisible({ timeout: 30000 });

    // Results should show band
    const bandLabels = [
      'Low evidence',
      'Some machine-like signals',
      'Elevated machine-like signals',
      'Strong machine-like signals',
    ];
    let foundBand = false;
    for (const label of bandLabels) {
      const el = page.locator(`text*="${label}"`);
      if (await el.count() > 0) {
        foundBand = true;
        break;
      }
    }
    expect(foundBand).toBe(true);
  });

  test('short essay shows appropriate error', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('#essay-input');
    await textarea.fill('Too short.');

    // Analyze button should be disabled or show minimum word hint
    await expect(page.locator('text=/Add at least/i')).toBeVisible();
  });

  test('can reset and analyze another essay', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('#essay-input');
    await textarea.fill(SAMPLE_ESSAY);

    await page.locator('#analyze-button').click();
    await expect(page.locator('text=/Overall Assessment/i')).toBeVisible({ timeout: 30000 });

    // Click reset
    await page.locator('text=/Analyze another essay/i').click();

    // Should be back to editor state
    await expect(page.locator('#essay-input')).toBeVisible();
    await expect(page.locator('#analyze-button')).toBeVisible();
  });

  test('example essays can be loaded', async ({ page }) => {
    await page.goto('/');

    // Click the first example essay button
    const exampleButtons = page.locator('button[aria-label*="Load example"]');
    const count = await exampleButtons.count();
    expect(count).toBeGreaterThan(0);

    await exampleButtons.first().click();

    // Textarea should have text now
    const textarea = page.locator('#essay-input');
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(50);
  });
});

test.describe('Evidence Panel', () => {
  test('clicking highlighted sentence opens evidence panel', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('#essay-input');
    await textarea.fill(SAMPLE_ESSAY);
    await page.locator('#analyze-button').click();

    // Wait for results
    await expect(page.locator('text=/Overall Assessment/i')).toBeVisible({ timeout: 30000 });

    // Try to click a highlighted sentence
    const highlighted = page.locator('[class*="highlight-"]').first();

    if (await highlighted.count() > 0) {
      await highlighted.click();

      // Evidence panel should appear
      await expect(page.locator('text=/Why was this flagged/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('evidence panel can be closed with Escape', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('#essay-input');
    await textarea.fill(SAMPLE_ESSAY);
    await page.locator('#analyze-button').click();
    await expect(page.locator('text=/Overall Assessment/i')).toBeVisible({ timeout: 30000 });

    const highlighted = page.locator('[class*="highlight-"]').first();

    if (await highlighted.count() > 0) {
      await highlighted.click();
      await expect(page.locator('text=/Why was this flagged/i')).toBeVisible({ timeout: 5000 });

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('text=/Why was this flagged/i')).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Navigation', () => {
  test('methodology page is accessible', async ({ page }) => {
    await page.goto('/methodology');
    await expect(page.locator('h1')).toContainText('Methodology');
  });

  test('evaluation page is accessible', async ({ page }) => {
    await page.goto('/evaluation');
    await expect(page.locator('h1')).toContainText('Evaluation');
  });

  test('evaluation page shows real metrics', async ({ page }) => {
    await page.goto('/evaluation');
    await expect(page.locator('text=/Accuracy/i').first()).toBeVisible();
    await expect(page.locator('text=/False Positive/i').first()).toBeVisible();
  });
});
