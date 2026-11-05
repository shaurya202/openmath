import { test, expect } from '@playwright/test';
import { ApExamsPage } from './pages/ApExamsPage';

test.describe('OpenMath AP Exam Hub', () => {
  let apPage: ApExamsPage;

  test.beforeEach(async ({ page }) => {
    apPage = new ApExamsPage(page);
    await apPage.goto();
  });

  test('should display AP courses and curriculum breakdown', async ({ page }) => {
    await expect(page.getByText('Advanced Placement Mathematics')).toBeVisible();
    await expect(page.getByRole('button', { name: 'AP Calculus BC' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AP Calculus AB' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AP Statistics' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'AP Precalculus' })).toBeVisible();

    await expect(page.getByText('Limits and Continuity')).toBeVisible();
  });

  test('should open and close key formula reference sheet', async ({ page }) => {
    await apPage.openKeyFormulas(0);
    await expect(page.getByText('L\'Hôpital\'s Rule')).toBeVisible();
    await expect(page.getByText('Intermediate Value Theorem (IVT)')).toBeVisible();

    // Close sheet
    const closeButton = page.getByRole('button', { name: /Close|Done/i }).or(page.locator('button:has-text("✕"), button[aria-label="Close"]'));
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });
});
